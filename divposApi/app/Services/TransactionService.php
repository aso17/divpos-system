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

            // Logic penentuan scope data (Tenant vs Outlet)
            $tenantId = $user->tenant_id;
            $outletId = null;

            if (is_null($tenantId)) {
                $outletId = $user->employee->outlet_id ?? null;
                $tenantId = $user->employee->tenant_id ?? null;
            }

            // Service tinggal panggil Repo tanpa tahu kerumitan Query-nya
            return $this->transactionRepo->getHistory($tenantId, $outletId, $params);

        } catch (\Exception $e) {
            $this->logDbErrorRepo->store([
                'user_id' => Auth::id(),
                'feature' => 'TRANSACTION_HISTORY',
                'message' => $e->getMessage() . " in Line " . $e->getLine(),
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

                // 1. Snapshot Data Paket & Petugas
                $packageIds = collect($data['items'])->pluck('package_id')->unique()->toArray();
                $packages = $this->transactionRepo->getPackagesByIds($packageIds);

                // 🔥 Ambil semua employee_id yang unik dari input untuk snapshot nama
                $employeeIds = collect($data['items'])->pluck('employee_id')->filter()->unique()->toArray();
                // Ambil data petugas (disarankan buat method getEmployeesByIds di repo jika ingin full repo pattern)
                $employees = \App\Models\Ms_Employee::whereIn('id', $employeeIds)->get();

                $calculatedItems = [];
                $totalBasePrice = 0;

                foreach ($data['items'] as $item) {
                    $package = $packages->firstWhere('id', $item['package_id']);
                    if (!$package) {
                        throw new \Exception("Layanan ID {$item['package_id']} tidak ditemukan.");
                    }

                    // 🔥 Cari info petugas untuk snapshot nama
                    $employee = $employees->firstWhere('id', $item['employee_id']);

                    $subtotal = (float) ($package->final_price * $item['qty']);
                    $totalBasePrice += $subtotal;

                    $calculatedItems[] = [
                        'tenant_id'      => $tenantId,
                        'package_id'     => $package->id,
                        'package_name'   => $package->name,
                        'original_price' => $package->price,
                        'unit'           => $package->unit->short_name ?? 'Pcs',
                        'qty'            => $item['qty'],
                        'employee_id'    => $item['employee_id'] ?? null,
                        // 🔥 SNAPSHOT NAMA PETUGAS
                        'employee_name'  => $employee ? $employee->full_name : null,
                        'price_per_unit' => $package->final_price,
                        'subtotal'       => $subtotal,
                        'notes'          => $item['notes'] ?? null,
                    ];
                }

                // --- 2. PERBAIKAN KALKULASI FINANSIAL (STRICT & DINAMIS) ---
                $grandTotal = (float) $totalBasePrice;
                $method = Ms_PaymentMethod::find($data['payment_method_id']);
                if (!$method) {
                    throw new \Exception("Metode pembayaran tidak valid.");
                }

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
                        if ($inputPayment < $tagihanSetelahDP) {
                            throw new \Exception("Nominal bayar kurang. Total yang harus dibayar: Rp " . number_format($tagihanSetelahDP));
                        }
                        $changeAmount = $inputPayment - $tagihanSetelahDP;
                        $netPaymentToday = $tagihanSetelahDP;
                    } else {
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

                // --- 3. PROSES SIMPAN DATA (MENGGUNAKAN REPO) ---
                $customerInfo = $this->handleCustomerLogic($data);

                $transaction = $this->transactionRepo->create([
                    'tenant_id'         => $tenantId,
                    'outlet_id'         => $data['outlet_id'],
                    'invoice_no'        => $numbers['invoice_no'],
                    'queue_number'      => $numbers['queue_number'],
                    'customer_id'       => $customerInfo['id'],
                    'customer_name'     => $customerInfo['name'],
                    'customer_phone'    => $customerInfo['phone'],
                    'order_date'        => now(),
                    'total_base_price'  => $totalBasePrice,
                    'grand_total'       => $grandTotal,
                    'dp_amount'         => $dpAmount,
                    'payment_method_id' => $method->id,
                    'payment_amount'    => $inputPayment,
                    'change_amount'     => $changeAmount,
                    'total_paid'        => $totalPaidAccumulated,
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
        if ($paid >= $total) {
            return Tr_Transaction::PAY_PAID;
        }
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
        $sql = null;
        $bindings = [];
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
        // Gunakan retry (angka 5) untuk menangani deadlock jika database sedang sibuk
        return DB::transaction(function () use ($data) {
            $user = Auth::user();
            $employee = $user->employee;
            $tenantId = $employee->tenant_id;

            // 1. Cari Transaksi dengan Lock (Penting untuk data finansial)
            $transaction = Tr_Transaction::where('tenant_id', $tenantId)
                ->lockForUpdate()
                ->findOrFail($data['transaction_id']);

            // Proteksi: Jika sudah lunas, jangan diproses lagi
            if ($transaction->payment_status === Tr_Transaction::PAY_PAID) {
                throw new \Exception("Transaksi ini sudah berstatus LUNAS.");
            }

            $inputAmount = (float) $data['payment_amount'];
            $totalPaidSekarang = (float) $transaction->total_paid;
            $grandTotal = (float) $transaction->grand_total;
            $sisaTagihan = $grandTotal - $totalPaidSekarang;

            // 2. Validasi Metode Pembayaran
            $methodId = $data['payment_method_id'];
            $method = Ms_PaymentMethod::where('id', $methodId)->first();

            if (!$method) {
                throw new \Exception("Metode pembayaran tidak valid.");
            }

            $changeAmount = 0;
            $amountToPay = 0;

            // --- LOGIC PEMBAYARAN (Sesuai SOP Mas A_so) ---
            if ($method->is_cash) {
                // Cash: Boleh lebih (ada kembalian), tidak boleh kurang
                if ($inputAmount < $sisaTagihan) {
                    throw new \Exception("Nominal bayar kurang. Sisa tagihan: Rp " . number_format($sisaTagihan, 0, ',', '.'));
                }
                $changeAmount = $inputAmount - $sisaTagihan;
                $amountToPay = $sisaTagihan; // Yang dicatat sebagai pembayaran adalah senilai sisanya saja
            } else {
                // Non-cash (QRIS/Transfer): Harus pas (Tolerance 0.01 untuk floating point)
                if (abs($inputAmount - $sisaTagihan) > 0.01) {
                    throw new \Exception("Pembayaran via {$method->name} harus nominal pas Rp " . number_format($sisaTagihan, 0, ',', '.'));
                }
                $amountToPay = $inputAmount;
                $changeAmount = 0;
            }

            // 3. Kalkulasi Status Baru
            $newTotalPaid = $totalPaidSekarang + $amountToPay;

            // Cek apakah sudah lunas (menggunakan perbandingan yang aman)
            $isLunas = ($newTotalPaid >= ($grandTotal - 0.01));

            $newPaymentStatus = $isLunas ? Tr_Transaction::PAY_PAID : Tr_Transaction::PAY_PARTIAL;
            $newOrderStatus = $isLunas ? Tr_Transaction::STATUS_COMPLETED : $transaction->status;

            // 4. Update Header Transaksi
            $transaction->update([
                'payment_method_id' => $method->id,
                'payment_amount'    => $inputAmount,  // Simpan input asli kasir untuk audit
                'change_amount'     => $changeAmount, // Simpan kembaliannya
                'total_paid'        => $newTotalPaid,
                'payment_status'    => $newPaymentStatus,
                'status'            => $newOrderStatus,
            ]);

            // 5. Catat ke Tabel History (Sangat Penting untuk Laporan Kas)
            $transaction->payments()->create([
                'tenant_id'           => $tenantId,
                'payment_method_id'   => $method->id,
                'payment_method_name' => $method->name,
                'amount'              => $amountToPay,
                'payment_date'        => now(),
                'received_by'         => $employee->full_name ?? $user->name,
            ]);

            // 6. Log Aktivitas
            $transaction->logs()->create([
                'tenant_id'   => $tenantId,
                'status'      => $newOrderStatus,
                'changed_by'  => $employee->full_name ?? $user->name,
                'description' => "Pelunasan sebesar Rp " . number_format($amountToPay, 0, ',', '.') . " via " . $method->name,
            ]);

            // Temp variable untuk response ke Frontend (agar modal sukses bisa tampil kembalian)
            $transaction->latest_payment = $inputAmount;
            $transaction->latest_change = $changeAmount;

            return $transaction;
        }, 5);
    }

    public function cancelTransaction(int $transactionId, string $reason = ''): Tr_Transaction
    {
        return DB::transaction(function () use ($transactionId, $reason) {
            $user     = Auth::user();
            $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

            // 1. Ambil data dengan Lock untuk keamanan data
            $transaction = Tr_Transaction::where('tenant_id', $tenantId)
                ->lockForUpdate()
                ->findOrFail($transactionId);

            // 2. VALIDASI BISNIS (SINKRON DENGAN FRONTEND)
            // Jangan izinkan cancel jika sudah Lunas (Paid)
            if ($transaction->payment_status === Tr_Transaction::PAY_PAID) {
                throw new \Exception("Transaksi yang sudah LUNAS tidak dapat dibatalkan.");
            }

            // Hanya boleh cancel jika status masih PENDING atau PROCESS
            $allowedStatus = [Tr_Transaction::STATUS_PENDING, Tr_Transaction::STATUS_PROCESS];
            if (!in_array($transaction->status, $allowedStatus)) {
                throw new \Exception("Transaksi tidak bisa dibatalkan karena sudah dalam tahap: " . $transaction->status);
            }

            // 3. LOGIC REFUND (Jika sudah ada DP/Uang Masuk)
            $refundNote = "";
            if ($transaction->total_paid > 0) {
                $refundAmount = $transaction->total_paid;
                $refundNote = " | REFUND DP: " . number_format($refundAmount, 0, ',', '.');

                // PENTING: Reset nilai bayar agar tidak terhitung di laporan Omzet
                $transaction->total_paid     = 0;
                $transaction->payment_amount = 0;
            }

            // 4. UPDATE DATA TRANSAKSI
            $transaction->status = Tr_Transaction::STATUS_CANCELED;
            // Gabungkan catatan lama dengan alasan pembatalan baru
            $transaction->notes  = trim(($transaction->notes ?? '') . " | Batal: " . $reason . $refundNote);
            $transaction->save();

            // 5. LOGGING AKTIVITAS
            $changedBy = $user->employee->full_name ?? $user->name ?? 'System';

            $transaction->logs()->create([
                'tenant_id'   => $tenantId,
                'status'      => Tr_Transaction::STATUS_CANCELED,
                'changed_by'  => $changedBy,
                'description' => "Transaksi dibatalkan. Alasan: " . ($reason ?: '-') . ($refundNote ? " (Dana dikembalikan)" : ""),
            ]);

            return $transaction;
        }, 5);
    }
}
