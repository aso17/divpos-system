<?php

namespace App\Services;

use App\Repositories\TransactionRepository;
use App\Repositories\LogDbErrorRepository;
use App\Models\Ms_Customer;
use App\Models\Ms_PaymentMethod;
use App\Models\Tr_Transaction;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class TransactionService
{
    protected $transactionRepo;
    protected $logDbErrorRepo;

    public function __construct(
        TransactionRepository $transactionRepo,
        LogDbErrorRepository $logDbErrorRepo
    ) {
        $this->transactionRepo = $transactionRepo;
        $this->logDbErrorRepo = $logDbErrorRepo;
    }

    // ... (bagian atas tetap sama)

    public function createTransaction(array $data)
    {
        if (empty($data['items'])) {
            throw new \Exception("Minimal harus ada 1 layanan yang dipilih.");
        }

        try {
            return DB::transaction(function () use ($data) {
                $user = Auth::user();
                $tenantId = $data['tenant_id'];

                // 1. Snapshot Data Paket
                $packageIds = collect($data['items'])->pluck('package_id')->unique()->toArray();
                $packages = $this->transactionRepo->getPackagesByIds($packageIds);

                $calculatedItems = [];
                $totalBasePrice = 0;

                foreach ($data['items'] as $item) {
                    $package = $packages->firstWhere('id', $item['package_id']);
                    if (!$package) {
                        throw new \Exception("Layanan ID {$item['package_id']} tidak ditemukan.");
                    }

                    $subtotal = (float) ($package->final_price * $item['qty']);
                    $totalBasePrice += $subtotal;

                    $calculatedItems[] = [
                        'tenant_id'      => $tenantId,
                        'package_id'     => $package->id,
                        'package_name'   => $package->name,
                        'original_price' => $package->price,
                        'unit'           => $package->unit->short_name ?? 'Pcs',
                        'qty'            => $item['qty'],
                        'price_per_unit' => $package->final_price,
                        'subtotal'       => $subtotal,
                        'notes'          => $item['notes'] ?? null,
                    ];
                }

                // --- 2. PERBAIKAN KALKULASI FINANSIAL (DEFENSIVE LOGIC) ---
                $grandTotal    = (float) $totalBasePrice;
                $method = Ms_PaymentMethod::find($data['payment_method_id']);
                
                // Ambil input asli kasir
                $inputDP      = (float) ($data['dp_amount'] ?? 0); 
                $inputPayment = (float) ($data['payment_amount'] ?? 0); 

                // A. DP tidak boleh melebihi Grand Total
                $dpAmount = min($inputDP, $grandTotal);
                
                // B. Sisa yang harus dibayar setelah DP
                $tagihanSetelahDP = $grandTotal - $dpAmount;

                // C. Hitung Kembalian: Hanya jika Cash dan input > sisa tagihan
                $changeAmount = 0;
                $netPaymentToday = 0;

                if ($method && $method->is_cash) {
                    $changeAmount = max(0, $inputPayment - $tagihanSetelahDP);
                    $netPaymentToday = $inputPayment - $changeAmount;
                } else {
                    
                    // Jika QRIS/Transfer, net payment ya sebesar tagihan (karena uang masuk harus pas)
                    // Atau gunakan input kasir tapi batasi maksimal sebesar tagihan
                    $netPaymentToday = min($inputPayment, $tagihanSetelahDP);
                    $changeAmount = 0; 
                }

                // D. Akumulasi Bayar (Untuk penentuan status)
                $totalPaidAccumulated = $dpAmount + $netPaymentToday;

                $paymentStatus = $this->determinePaymentStatus($totalPaidAccumulated, $grandTotal);
                
                // Transaksi selesai hanya jika Lunas
                $transactionStatus = ($paymentStatus === Tr_Transaction::PAY_PAID) 
                    ? Tr_Transaction::STATUS_COMPLETED 
                    : Tr_Transaction::STATUS_PENDING;

                // --- 3. PROSES SIMPAN DATA ---
                $customerInfo = $this->handleCustomerLogic($data);     
                $methodName = $method ? $method->name : 'Unknown';

                $transaction = $this->transactionRepo->create([
                    'tenant_id'         => $tenantId,
                    'outlet_id'         => $data['outlet_id'],
                    'invoice_no'        => $this->generateInvoiceNumber($tenantId),
                    'customer_id'       => $customerInfo['id'],
                    'customer_name'     => $customerInfo['name'],
                    'customer_phone'    => $customerInfo['phone'],
                    'order_date'        => now(),
                    'total_base_price'  => $totalBasePrice,
                    'grand_total'       => $grandTotal,
                    'dp_amount'         => $dpAmount,
                    'payment_method_id' => $data['payment_method_id'],
                    'payment_amount'    => $inputPayment, // Simpan input asli untuk audit
                    'change_amount'     => $changeAmount,
                    'total_paid'        => $totalPaidAccumulated,
                    'status'            => $transactionStatus,
                    'order_year'        => date('Y'),
                    'order_month'       => date('m'),
                    'payment_status'    => $paymentStatus,
                    'notes'             => $data['notes'] ?? null,
                ]);

                // 4. Detail, 5. Payment History (Gunakan netPaymentToday + dpAmount)
                $transaction->details()->createMany($calculatedItems);

                // Catat history pembayaran jika ada uang masuk
                $totalUangMasukReal = $dpAmount + $netPaymentToday;
                if ($totalUangMasukReal > 0) {
                    $transaction->payments()->create([
                        'tenant_id'           => $tenantId,
                        'payment_method_id'   => $data['payment_method_id'],
                        'payment_method_name' => $methodName, 
                        'amount'              => $totalUangMasukReal,
                        'payment_date'        => now(),
                        'received_by'         => $user->full_name ?? 'Kasir',
                    ]);
                }

                // 6. Logging
                $transaction->logs()->create([
                    'tenant_id'   => $tenantId,
                    'status'      => $transactionStatus,
                    'changed_by'  => $user->full_name ?? 'System',
                    'description' => 'Transaksi berhasil dibuat.',
                ]);

                return $transaction;
            }, 5);

        } catch (\Exception $e) {
            $this->handleLogError($e, $data);
            throw $e;
        }
    }

    private function determinePaymentStatus($paid, $total) 
    {
        if ($paid >= $total) return Tr_Transaction::PAY_PAID;
        return $paid > 0 ? Tr_Transaction::PAY_PARTIAL : Tr_Transaction::PAY_UNPAID;
    }

    private function handleCustomerLogic($data) 
    {
        $name  = $data['customer']['name'] ?? 'Pelanggan Umum';
        $phone = $data['customer']['phone'] ?? null;

        if (!$phone) {
            return ['id' => null, 'name' => $name, 'phone' => $phone];
        }

        // firstOrCreate sudah cukup aman dalam DB Transaction
        $customer = Ms_Customer::firstOrCreate(
            ['tenant_id' => $data['tenant_id'], 'phone' => $phone],
            ['name' => $name]
        );

        return ['id' => $customer->id, 'name' => $customer->name, 'phone' => $customer->phone];
    }

    private function generateInvoiceNumber($tenantId) 
    {
        $prefix = "INV/" . date('Ymd') . "/";       
        $yearNow = date('Y');
        $monthNow = date('m');
        
        $last = $this->transactionRepo->getLastInvoice($tenantId, $yearNow,$monthNow);
        
        $count = $last ? ((int) substr($last->invoice_no, -4)) + 1 : 1;
        return $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    private function handleLogError(\Exception $e, array $data)
    {
        $sql = null; $bindings = [];
        if ($e instanceof QueryException) {
            $sql = $e->getSql();
            $bindings = $e->getBindings();
        }

        $this->logDbErrorRepo->store([
            'user_id'    => Auth::id(),
            'tenant_id'  => $data['tenant_id'] ?? null,
            'error_code' => $e->getCode() ?: 500,
            'message'    => "Transaction Error: " . $e->getMessage(),
            'sql_query'  => $sql,
            'bindings'   => $bindings,
            'url'        => Request::fullUrl(),
            'ip_address' => Request::ip(),
        ]);
    }
}