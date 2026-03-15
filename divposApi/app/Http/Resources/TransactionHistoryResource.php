<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class TransactionHistoryResource extends JsonResource
{
    public function toArray($request)
    {
        // 1. Logic Sisa Tagihan
        $remaining = $this->grand_total - $this->total_paid;

        return [
            'id'             => CryptoHelper::encrypt($this->id),
            'invoice_no'     => $this->invoice_no,
            
            // 2. Customer
            'customer_name'  => $this->customer_name ?? 'Pelanggan Umum',
            'customer_phone' => $this->customer_phone ?? '-',
            
            // 3. Finansial (Data Dasar)
            'grand_total'    => (float) $this->grand_total,
            'total_paid'     => (float) $this->total_paid,
            'remaining_bill' => $remaining > 0 ? (float) $remaining : 0,

            /**
             * 4. KHUSUS UNTUK MODAL SUKSES & PRINT
             * Kita ambil nilai transaksi terakhir jika ada. 
             * 'latest_payment' dan 'latest_change' ini diset manual di Controller/Service 
             * saat proses pelunasan berhasil.
             */
            'details' => TransactionDetailResource::collection($this->whenLoaded('details')),
            'outlet'  => new OutletResource($this->whenLoaded('outlet')),
            'payment_amount' => (float) ($this->latest_payment ?? $this->payment_amount),
            'change_amount'  => (float) ($this->latest_change ?? $this->change_amount),
            
            // 5. Status & Styling
            'payment_status' => $this->payment_status,
            'status'         => $this->status,
            
            // 6. Audit & Relasi
            'cashier'        => $this->creator->employee->full_name ?? 'System',
            'payment_method' => $this->initialPaymentMethod->name ?? '-',

            // 7. Waktu (Sudah sinkron dengan Asia/Jakarta di config Mas tadi)
            'order_date'     => $this->order_date ? $this->order_date->format('d M Y H:i') : '-',
            'human_date'     => $this->order_date ? $this->order_date->diffForHumans() : '-',
        ];
    }
}