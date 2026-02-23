<?php

namespace App\Services;

use App\Repositories\CustomerRepository;
use App\Models\Tr_order; // Sesuaikan nama model order Anda
use App\Models\Tr_order_item;
use App\Helpers\CryptoHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionService
{
    protected $customerRepo;

    public function __construct(CustomerRepository $customerRepo)
    {
        $this->customerRepo = $customerRepo;
    }

    // public function createTransaction(array $data)
    // {
    //     return DB::transaction(function () use ($data) {
    //         // 1. Dekripsi Dasar
    //         $tenantId = (int) CryptoHelper::decrypt($data['tenant_id']);
    //         $userId = CryptoHelper::decrypt($data['created_by']) ?? $data['created_by'];

    //         // 2. Handling Customer (Baru atau Lama)
    //         $customerId = $this->handleCustomer($tenantId, $data['customer'], $userId);

    //         // 3. Generate Nomor Invoice (Contoh: INV/2026/02/0001)
    //         $invoiceNo = $this->generateInvoiceNumber($tenantId);

    //         // 4. Simpan Header Order (tr_orders)
    //         $order = Tr_order::create([
    //             'tenant_id'      => $tenantId,
    //             'customer_id'    => $customerId,
    //             'invoice_no'     => $invoiceNo,
    //             'total_price'    => $data['grand_total'],
    //             'payment_amount' => $data['payment_amount'],
    //             'change_amount'  => $data['change_amount'],
    //             'status'         => 'PROCESS', // Default status
    //             'created_by'     => $userId,
    //         ]);

    //         // 5. Simpan Item Order (tr_order_items)
    //         foreach ($data['items'] as $item) {
    //             Tr_order_item::create([
    //                 'order_id'   => $order->id,
    //                 'package_id' => (int) CryptoHelper::decrypt($item['package_id']),
    //                 'qty'        => $item['qty'],
    //                 'price'      => $item['price'],
    //                 'subtotal'   => $item['subtotal'],
    //             ]);
    //         }

    //         return $order->load(['customer', 'items.package']);
    //     });
    // }

    // /**
    //  * Logika untuk menentukan pakai customer lama atau buat baru
    //  */
    // private function handleCustomer($tenantId, $customerData, $userId)
    // {
    //     // Jika is_new false dan ada ID, gunakan customer lama
    //     if (!$customerData['is_new'] && !empty($customerData['id'])) {
    //         return (int) CryptoHelper::decrypt($customerData['id']);
    //     }

    //     // Jika baru, buat customer di database
    //     $newCustomer = $this->customerRepo->create([
    //         'tenant_id'  => $tenantId,
    //         'name'       => $customerData['name'],
    //         'phone'      => $customerData['phone'],
    //         'created_by' => $userId
    //     ]);

    //     return $newCustomer->id;
    // }

    // /**
    //  * Generate Invoice: INV / TAHUNBULAN / URUTAN
    //  */
    // private function generateInvoiceNumber($tenantId)
    // {
    //     $prefix = "INV/" . date('Ym') . "/";
    //     $lastOrder = Tr_order::where('tenant_id', $tenantId)
    //         ->where('invoice_no', 'like', $prefix . '%')
    //         ->orderBy('id', 'desc')
    //         ->first();

    //     $nextNumber = $lastOrder 
    //         ? ((int) substr($lastOrder->invoice_no, -4)) + 1 
    //         : 1;

    //     return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    // }
}