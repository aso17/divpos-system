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

    public function createTransaction(array $data)
    {
        // Validasi dasar sebelum masuk DB Transaction
        if (empty($data['items'])) {
            throw new \Exception("Minimal harus ada 1 layanan yang dipilih.");
        }

        try {
            return DB::transaction(function () use ($data) {
                $user = Auth::user();
                $tenantId = $data['tenant_id'];

                // 1. Snapshot Data Paket (Optimasi: ambil sekaligus)
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

                // 2. Kalkulasi Finansial
                $grandTotal    = (float) $totalBasePrice;
                $dpAmount      = (float) ($data['dp_amount'] ?? 0); 
                $paymentAmount = (float) ($data['payment_amount'] ?? 0); 

                $sisaTagihan   = $grandTotal - $dpAmount;
                $changeAmount  = max(0, $paymentAmount - $sisaTagihan);
                $netPaymentToday = $paymentAmount - $changeAmount;
                $totalPaidAccumulated = min($grandTotal, $dpAmount + $netPaymentToday);

                $paymentStatus = $this->determinePaymentStatus($totalPaidAccumulated, $grandTotal);
                $transactionStatus = ($paymentStatus === Tr_Transaction::PAY_PAID) 
                    ? Tr_Transaction::STATUS_COMPLETED 
                    : Tr_Transaction::STATUS_PENDING;

                $customerInfo = $this->handleCustomerLogic($data);
                
                // Ambil info metode pembayaran (Cache/Snapshot)
                $method = Ms_PaymentMethod::find($data['payment_method_id']);
                $methodName = $method ? $method->name : 'Unknown';
                $yearNow = date('Y');
                $monthNow = date('m');
        
                // 3. Simpan Header (Lock Invoice Number ditangani di Repo/generate)
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
                    'payment_amount'    => $paymentAmount,
                    'change_amount'     => $changeAmount,
                    'total_paid'        => $totalPaidAccumulated,
                    'status'            => $transactionStatus,
                    'order_year'        => $yearNow,
                    'order_month'       => $monthNow,
                    'payment_status'    => $paymentStatus,
                    'notes'             => $data['notes'] ?? null,
                ]);

                // 4. Batch Insert Details
                $transaction->details()->createMany($calculatedItems);

                // 5. Simpan History Pembayaran
                if ($netPaymentToday > 0) {
                    $transaction->payments()->create([
                        'tenant_id'           => $tenantId,
                        'payment_method_id'   => $data['payment_method_id'],
                        'payment_method_name' => $methodName, 
                        'amount'              => $netPaymentToday,
                        'payment_date'        => now(),
                        'received_by'         => $user->name ?? 'Kasir',
                    ]);
                }

                // 6. Logging
                $transaction->logs()->create([
                    'tenant_id'   => $tenantId,
                    'status'      => $transactionStatus,
                    'changed_by'  => $user->name ?? 'System',
                    'description' => 'Transaksi berhasil diproses.',
                ]);

                return $transaction;
            }, 5); // Angka 5 artinya mencoba ulang 5x jika terjadi deadlock otomatis oleh DB

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