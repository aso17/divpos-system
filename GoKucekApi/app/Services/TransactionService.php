<?php

namespace App\Services;

use App\Models\Tr_Transaction;
use App\Repositories\TransactionRepository;
use App\Models\Ms_Customer; 
use App\Helpers\CryptoHelper; 
use Illuminate\Support\Facades\DB;

class TransactionService
{
    protected $packageService;
    protected $transactionRepository;

    public function __construct(PackageService $packageService, TransactionRepository $transactionRepository)
    {
        $this->packageService = $packageService;
        $this->transactionRepository = $transactionRepository;
    }

    public function getTransactionHistory($payload)
    {
        // Dekripsi tenant_id dari frontend
        $tenantId = CryptoHelper::decrypt($payload['tenant_id']);
        
        return $this->transactionRepository->getHistory($tenantId, $payload);
    }

    public function createTransaction(array $data)
    {
        return DB::transaction(function () use ($data) {
            $calculatedItems = [];
            $grandTotalServer = 0;

            // 1. Kalkulasi & Sanitasi Data
            foreach ($data['items'] as $item) {
                $packageId = CryptoHelper::decrypt($item['package_id']);
                $package = $this->packageService->getPackageById($packageId);
                
                if (!$package) throw new \Exception("Layanan tidak ditemukan.");

                // Paksa ke Integer untuk menghindari floating point bug (Rp 4.997)
                $subtotal = (int) round($package->price * $item['qty']);
                $grandTotalServer += $subtotal;

                $calculatedItems[] = [
                    'package_id'   => $packageId,
                    'package_name' => strip_tags($package->name), 
                    'qty'          => $item['qty'],
                    'price'        => (int) $package->price,
                    'subtotal'     => $subtotal,
                ];
            }

            // 2. Cek Pembayaran
            $paymentAmount = (int) $data['payment_amount'];
            $changeAmount = $paymentAmount - $grandTotalServer;

            if ($changeAmount < 0) {
                throw new \Exception("Uang pembayaran kurang dari total tagihan.");
            }

            // 3. Handle Customer (Sanitasi input)
            $customer = $this->handleCustomer($data['tenant_id'], [
                'name'  => strip_tags($data['customer']['name']),
                'phone' => strip_tags($data['customer']['phone']),
            ], $data['created_by']);

            // 4. Status Pembayaran
            $totalPaidNow = ($paymentAmount >= $grandTotalServer) ? $grandTotalServer : $paymentAmount;
            $paymentStatus = ($totalPaidNow >= $grandTotalServer) ? 'PAID' : ($totalPaidNow > 0 ? 'PARTIAL' : 'UNPAID');

            // 5. Simpan Header
            $transaction = Tr_Transaction::create([
                'tenant_id'         => $data['tenant_id'],
                'outlet_id'         => $data['outlet_id'],
                'invoice_no'        => $this->generateInvoiceNumber($data['tenant_id']),
                'customer_id'       => $customer->id,
                'customer_name'     => $customer->name,
                'customer_phone'    => $customer->phone,
                'order_date'        => now(),
                'total_base_price'  => $grandTotalServer,
                'grand_total'       => $grandTotalServer,
                'payment_method_id' => $data['payment_method_id'],
                'payment_amount'    => $paymentAmount,
                'change_amount'     => $changeAmount,
                'total_paid'        => $totalPaidNow,
                'status'            => Tr_Transaction::STATUS_PENDING,
                'payment_status'    => $paymentStatus,
                'created_by'        => $data['created_by'],
            ]);

            // 6. Simpan Detail (Pastikan nama kolom di DB sesuai)
            foreach ($calculatedItems as $cItem) {
                $transaction->details()->create([
                    'tenant_id'      => $data['tenant_id'],
                    'package_id'     => $cItem['package_id'],
                    'package_name'   => $cItem['package_name'],
                    'qty'            => $cItem['qty'],
                    'price_per_unit' => $cItem['price'], // Sesuaikan dengan nama kolom tabel detail Mas
                    'subtotal'       => $cItem['subtotal'],
                ]);
            }

            // 7. Catat Pembayaran & Log
            if ($totalPaidNow > 0) {
                $transaction->payments()->create([
                    'tenant_id'         => $data['tenant_id'],
                    'payment_method_id' => $data['payment_method_id'],
                    'amount'            => $totalPaidNow,
                    'payment_date'      => now(),
                    'paid_by'           => $customer->name,
                    'received_by'       => $data['created_by'],
                ]);
            }

            $transaction->logs()->create([
                'tenant_id'   => $data['tenant_id'],
                'status'      => Tr_Transaction::STATUS_PENDING,
                'changed_by'  => $data['created_by'],
                'description' => 'Transaksi baru dibuat.',
            ]);

            return $transaction;
        });
    }

    private function handleCustomer($tenantId, $customerData, $userId)
    {
        return Ms_Customer::firstOrCreate(
            [
                'tenant_id' => $tenantId,
                'phone'     => $customerData['phone'],
            ],
            [
                'name'       => $customerData['name'],
                'created_by' => $userId
            ]
        );
    }

    private function generateInvoiceNumber($tenantId)
    {
        $prefix = "INV/" . date('Ym') . "/";
        $last = Tr_Transaction::where('tenant_id', $tenantId)
                ->where('invoice_no', 'like', $prefix . '%')
                ->latest('id')->first();
        
        $count = $last ? ((int) substr($last->invoice_no, -4)) + 1 : 1;
        return $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}