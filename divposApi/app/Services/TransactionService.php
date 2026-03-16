<?php

namespace App\Services;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use App\Repositories\TransactionRepository;
use App\Repositories\LogDbErrorRepository;
use App\Models\Ms_Customer;
use App\Models\Ms_PaymentMethod;
use App\Models\Tr_Transaction;
use App\Helpers\CryptoHelper;

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

   public function getTransactionHistory(array $params)
    {
        try {

        $user = Auth::user();
        $perPage = $params['per_page'] ?? 10;

        $tenantId = $user->tenant_id;
        $outletId = null;

        if (is_null($tenantId)) {
            $outletId = $user->employee->outlet_id ?? null;
            $tenantId = $user->employee->tenant_id ?? null;
        }

        $query = $this->transactionRepo->getBaseQuery($tenantId, $outletId);

        /**
         * 2. EAGER LOADING (Hanya tarik kolom yang perlu saja)
         */
        $query->with([
            // Hanya tarik kolom yang akan tampil di struk/tabel
            'outlet:id,name,phone,city,address', 
            
            'creator' => function($q) {
                // WAJIB: select 'id' agar relasi ke employee nyambung
                $q->select('id')->with(['employee:id,user_id,full_name']); 
            },
            'initialPaymentMethod:id,name'
        ]);

        /**
         * 3. OPTIMASI KOLOM UTAMA
         */
        $query->select([
            'id', 
            'outlet_id', // WAJIB ada agar relasi 'outlet' bisa jalan
            'invoice_no', 
            'queue_number',
            'customer_name', 
            'customer_phone', 
            'order_date', 
            'grand_total', 
            'total_paid', 
            'status', 
            'payment_status', 
            'created_by', 
            'payment_method_id'
            // 'tenant_id' dihilangkan dari select jika tidak butuh di frontend
        ]);

        // 4, 5, 6: Logic Search & Filter tetap sama (sudah efisien)
        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->where('invoice_no', 'like', $keyword . '%')
                  ->orWhere('customer_phone', 'like', $keyword . '%')
                  ->orWhere('customer_name', 'like', '%' . $keyword . '%');
            });
        }

            // 5. Filter Payment Status
            if (!empty($params['payment_status']) && $params['payment_status'] !== 'ALL') {
                if ($params['payment_status'] === 'UNPAID') {
                    $query->whereIn('payment_status', [
                        Tr_Transaction::PAY_UNPAID, 
                        Tr_Transaction::PAY_PARTIAL
                    ]);
                } else {
                    $query->where('payment_status', Tr_Transaction::PAY_PAID);
                }
            }

            // 6. Filter Order Status
            if (!empty($params['status']) && $params['status'] !== 'ALL') {
                if ($params['status'] === 'ACTIVE') {
                    $query->whereNotIn('status', [
                        Tr_Transaction::STATUS_TAKEN, 
                        Tr_Transaction::STATUS_CANCELED
                    ]);
                } else {
                    $query->where('status', $params['status']);
                }
            }

            // 7. Sortir (Terbaru di atas) & Eksekusi
            return $query->orderBy('order_date', 'desc')->paginate($perPage);

        } catch (\Exception $e) {
            $this->logDbErrorRepo->store([
                'user_id' => Auth::id(),
                'feature' => 'TRANSACTION_HISTORY',
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

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

                // --- 2. PERBAIKAN KALKULASI FINANSIAL (STRICT & DINAMIS) ---
                $grandTotal = (float) $totalBasePrice;
                $method = Ms_PaymentMethod::find($data['payment_method_id']);
                if (!$method) throw new \Exception("Metode pembayaran tidak valid.");

                $inputDP      = (float) ($data['dp_amount'] ?? 0); 
                $inputPayment = (float) ($data['payment_amount'] ?? 0); 

                // A. Handle DP: Cek apakah metode membolehkan DP
                if ($inputDP > 0 && !$method->is_dp_enabled) {
                    throw new \Exception("Metode {$method->name} tidak mendukung pembayaran DP.");
                }
                $dpAmount = min($inputDP, $grandTotal);
                $tagihanSetelahDP = $grandTotal - $dpAmount;

                // B. Handle Pembayaran & Kembalian
                $changeAmount = 0;
                $netPaymentToday = 0;

                if ($inputPayment > 0) {
                    if ($method->is_cash) {
                        // Jika Cash: Tidak boleh kurang dari sisa tagihan
                        if ($inputPayment < $tagihanSetelahDP) {
                            throw new \Exception("Nominal bayar kurang. Total yang harus dibayar: Rp " . number_format($tagihanSetelahDP));
                        }
                        $changeAmount = $inputPayment - $tagihanSetelahDP;
                        $netPaymentToday = $tagihanSetelahDP; // Hanya ambil sebesar tagihan untuk omzet
                    } else {
                        // Jika Non-Cash (QRIS/Transfer): Harus PAS
                        if (abs($inputPayment - $tagihanSetelahDP) > 0.01) {
                            throw new \Exception("Pembayaran {$method->name} harus pas Rp " . number_format($tagihanSetelahDP));
                        }
                        $netPaymentToday = $inputPayment;
                        $changeAmount = 0; 
                    }
                }

                // C. Akumulasi Bayar & Status
                $totalPaidAccumulated = $dpAmount + $netPaymentToday;
                $paymentStatus = $this->determinePaymentStatus($totalPaidAccumulated, $grandTotal);
                
                $transactionStatus = ($paymentStatus === Tr_Transaction::PAY_PAID) 
                    ? Tr_Transaction::STATUS_COMPLETED 
                    : Tr_Transaction::STATUS_PENDING;


               $numbers = $this->generateTransactionNumbers($tenantId);
                // --- 3. PROSES SIMPAN DATA ---
                $customerInfo = $this->handleCustomerLogic($data);     

                $transaction = $this->transactionRepo->create([
                    'tenant_id'         => $tenantId,
                    'outlet_id'         => $data['outlet_id'],
                    'invoice_no'   => $numbers['invoice_no'],
                    'queue_number' => $numbers['queue_number'],
                    'customer_id'       => $customerInfo['id'],
                    'customer_name'     => $customerInfo['name'],
                    'customer_phone'    => $customerInfo['phone'],
                    'order_date'        => now(),
                    'total_base_price'  => $totalBasePrice,
                    'grand_total'       => $grandTotal,
                    'dp_amount'         => $dpAmount,
                    'payment_method_id' => $method->id,
                    'payment_amount'    => $inputPayment, // Audit Trail: Berapa uang fisik yang diterima
                    'change_amount'     => $changeAmount,  // Audit Trail: Berapa kembaliannya
                    'total_paid'        => $totalPaidAccumulated, // Total saldo masuk ke sistem
                    'status'            => $transactionStatus,
                    'payment_status'    => $paymentStatus,
                    'order_year'        => date('Y'),
                    'order_month'       => date('m'),
                    'notes'             => $data['notes'] ?? null,
                ]);

                // 4. Simpan Detail & History Payment
                $transaction->details()->createMany($calculatedItems);

                if ($totalPaidAccumulated > 0) {
                    $transaction->payments()->create([
                        'tenant_id'           => $tenantId,
                        'payment_method_id'   => $method->id,
                        'payment_method_name' => $method->name,
                        'amount'              => $totalPaidAccumulated,
                        'payment_date'        => now(),
                        'received_by'         => $user->employee->full_name ?? 'Kasir',
                    ]);
                }

                // 5. Logging
                $transaction->logs()->create([
                    'tenant_id'   => $tenantId,
                    'status'      => $transactionStatus,
                    'changed_by'  => $user->employee->full_name ?? 'System',
                    'description' => 'Transaksi dibuat dengan status ' . $paymentStatus,
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

        // 1. Cari atau buat customer
    $customer = Ms_Customer::firstOrCreate(
        ['tenant_id' => $data['tenant_id'], 'phone' => $phone],
        ['name' => $name, 'point' => 0] // Set point 0 kalau baru dibuat
    );

    
    $customer->increment('point', 1);

        return ['id' => $customer->id, 'name' => $customer->name, 'phone' => $customer->phone];
    }

   


    private function generateTransactionNumbers($tenantId) 
    {
        $yearNow = date('Y');
        $monthNow = date('m');
        $today = date('Y-m-d');
        
        // 1. Ambil record terakhir yang sudah di-LOCK
        $last = $this->transactionRepo->getLastInvoice($tenantId, $yearNow, $monthNow);
        
        // --- LOGIKA INVOICE (Urut per bulan/tahun) ---
        $prefix = "INV/" . date('Ymd') . "/";
        $count = $last ? ((int) substr($last->invoice_no, -4)) + 1 : 1;
        $invoiceNo = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);

        // --- LOGIKA QUEUE (Reset harian per outlet) ---
        $newQueue = 1; // Default jika hari baru
        if ($last) {
            // Cek apakah tanggal di record terakhir sama dengan hari ini
            $lastDate = $last->order_date ? $last->order_date->format('Y-m-d') : null;
            
            if ($lastDate === $today) {
                $newQueue = (int)$last->queue_number + 1;
            }
        }

        return [
            'invoice_no'   => $invoiceNo,
            'queue_number' => $newQueue
        ];
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

    public function processPayment(array $data)
    {
        return DB::transaction(function () use ($data) {
            $user = Auth::user();
            $tenantId = $user->employee->tenant_id;

            // 1. Cari Transaksi dengan Lock (Keamanan data keuangan)
            $transaction = Tr_Transaction::where('tenant_id', $tenantId)
                ->lockForUpdate()
                ->findOrFail($data['transaction_id']);

            if ($transaction->payment_status === Tr_Transaction::PAY_PAID) {
                throw new \Exception("Transaksi ini sudah berstatus LUNAS.");
            }

            $inputAmount = (float) $data['payment_amount'];
            $sisaTagihan = (float) ($transaction->grand_total - $transaction->total_paid);

            // 2. Tentukan Metode Pembayaran
            $methodId = $data['payment_method_id'] ?? $transaction->payment_method_id;
            $method = Ms_PaymentMethod::find($methodId);
            if (!$method) throw new \Exception("Metode pembayaran tidak valid.");

            $changeAmount = 0;
            $amountToPay = 0;

            // --- LOGIC STRICT PAYMENT (SAMA DENGAN CREATE) ---
            if ($method->is_cash) {
                // Cash: Tidak boleh kurang dari sisa tagihan
                if ($inputAmount < $sisaTagihan) {
                    throw new \Exception("Nominal bayar kurang. Sisa tagihan: Rp " . number_format($sisaTagihan));
                }
                $changeAmount = $inputAmount - $sisaTagihan;
                $amountToPay = $sisaTagihan; // Yang masuk ke omzet adalah sisa tagihannya
            } else {
                // Non-cash (QRIS/Transfer): Harus PAS sesuai sisa tagihan
                // Pakai abs() untuk handle error floating point minor
                if (abs($inputAmount - $sisaTagihan) > 0.01) {
                    throw new \Exception("Pembayaran {$method->name} harus pas Rp " . number_format($sisaTagihan));
                }
                $amountToPay = $inputAmount;
                $changeAmount = 0;
            }

            // 3. Update Header Transaksi
            $newTotalPaid = $transaction->total_paid + $amountToPay;
            
            // Penentuan Status Final
            $newPaymentStatus = ($newTotalPaid >= $transaction->grand_total) 
                ? Tr_Transaction::PAY_PAID 
                : Tr_Transaction::PAY_PARTIAL;

            $newOrderStatus = ($newPaymentStatus === Tr_Transaction::PAY_PAID) 
                ? Tr_Transaction::STATUS_COMPLETED 
                : $transaction->status;


        
                
            $transaction->update([
                'payment_method_id' => $method->id,
                'payment_amount'    => $inputAmount,  // Audit: Nominal asli yang diketik kasir
                'change_amount'     => $changeAmount, // Audit: Kembaliannya
                'total_paid'        => $newTotalPaid,
                'payment_status'    => $newPaymentStatus,
                'status'            => $newOrderStatus,
            ]);

            // 4. Catat ke Tabel History Pembayaran
            $transaction->payments()->create([
                'tenant_id'           => $tenantId,
                'payment_method_id'   => $method->id,
                'payment_method_name' => $method->name,
                'amount'              => $amountToPay,
                'payment_date'        => now(),
                'received_by'         => $user->employee->full_name ?? 'Kasir',
            ]);

            // 5. Log Aktivitas
            $transaction->logs()->create([
                'tenant_id'   => $tenantId,
                'status'      => $newOrderStatus,
                'changed_by'  => $user->employee->full_name ?? 'System',
                'description' => "Pelunasan sebesar " . number_format($amountToPay) . " menggunakan " . $method->name,
            ]);

            $transaction->latest_payment = $inputAmount;
            $transaction->latest_change = $changeAmount;

            
            return $transaction;
        }, 5);
    }



}