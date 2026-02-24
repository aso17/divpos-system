<?php

namespace App\Services;

use App\Models\Tr_Transaction;
use App\Models\Tr_TransactionDetail;
use App\Models\Tr_Payment;
use App\Models\Tr_StatusLog;
use App\Repositories\CustomerRepository;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionService
{
    protected $customerRepo;

    public function __construct(CustomerRepository $customerRepo)
    {
        $this->customerRepo = $customerRepo;
    }

   public function createTransaction(array $data)
    {
        // Pastikan pakai Throwable agar menangkap semua jenis error (Error & Exception)
        return DB::transaction(function () use ($data) {
            try {
                // 1. Handle Customer
                $customer = $this->handleCustomer($data['tenant_id'], $data['customer'], $data['created_by']);

                // 2. Simpan Header
                $transaction = Tr_Transaction::create([
                    'tenant_id'         => $data['tenant_id'],
                    'outlet_id'         => $data['outlet_id'],
                    'invoice_no'        => $this->generateInvoiceNumber($data['tenant_id']),
                    'customer_id'       => $customer->id,
                    'customer_name'     => $customer->name,
                    'customer_phone'    => $customer->phone,
                    'order_date'        => now(),
                    'total_base_price'  => $data['grand_total'],
                    'grand_total'       => $data['grand_total'],
                    'payment_method_id' => $data['payment_method_id'],
                    'payment_amount'    => $data['payment_amount'],
                    'change_amount'     => $data['change_amount'],
                    'total_paid'        => $data['payment_amount'] - $data['change_amount'],
                    'status'            => Tr_Transaction::STATUS_PENDING,
                    'payment_status'    => 'PAID',
                    'created_by'        => $data['created_by'],
                ]);

                // 3. Simpan Detail
                foreach ($data['items'] as $item) {
                    $transaction->details()->create([ // Gunakan relasi agar lebih konsisten
                        'tenant_id'      => $data['tenant_id'],
                        'package_id'     => $item['package_id'],
                        'package_name'   => $item['package_name'] ?? 'Layanan',
                        'qty'            => $item['qty'],
                        'price_per_unit' => $item['price'],
                        'subtotal'       => $item['subtotal'],
                    ]);
                }

                // 4. Catat Payment
                $transaction->payments()->create([
                    'tenant_id'         => $data['tenant_id'],
                    'payment_method_id' => $data['payment_method_id'],
                    'amount'            => $data['payment_amount'] - $data['change_amount'],
                    'payment_date'      => now(),
                    'paid_by'           => $customer->name,
                    'received_by'       => $data['created_by'],
                ]);

                // 5. Catat Log Status
                $transaction->logs()->create([
                    'tenant_id'   => $data['tenant_id'],
                    'status'      => Tr_Transaction::STATUS_PENDING,
                    'changed_by'  => $data['created_by'],
                    'description' => 'Transaksi baru dibuat.',
                ]);

                return $transaction->load(['details', 'customer']);

            } catch (\Throwable $e) {
                // Jika ada satu hal kecil saja yang gagal, PostgreSQL WAJIB rollback di sini
                // Kita throw lagi supaya DB::transaction tahu ada kegagalan
                throw $e; 
            }
        });
    }

    private function handleCustomer($tenantId, $customerData, $userId)
    {
        // Panggil langsung model Ms_Customer
        return \App\Models\Ms_Customer::firstOrCreate(
            [
                'tenant_id' => $tenantId,
                'phone'     => $customerData['phone'],
                'name'      => $customerData['name']
            ],
            ['created_by' => $userId]
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