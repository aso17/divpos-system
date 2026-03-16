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
            'queue_number' => $this->queue_number 
                            ? str_pad($this->queue_number, 2, '0', STR_PAD_LEFT) 
                            : '00',
            
            // 2. Customer
            'customer_name'  => $this->customer_name ?? 'Pelanggan Umum',
            'customer_phone' => $this->customer_phone ?? '-',
            
            // 3. Finansial
            'grand_total'    => (float) $this->grand_total,
            'total_paid'     => (float) $this->total_paid,
            'remaining_bill' => $remaining > 0 ? (float) $remaining : 0,

            // 4. KHUSUS PRINT & DETAIL
            // Pakai whenLoaded agar List History tidak berat, tapi tetap muncul saat dipanggil
            'details'        => TransactionDetailResource::collection($this->whenLoaded('details')),
            
            // PERBAIKAN: Gunakan optional chaining (?->) agar tidak crash jika outlet null
            'outlet'         => $this->outlet ? new OutletResource($this->outlet) : null,
            
            'payment_amount' => (float) ($this->latest_payment ?? $this->payment_amount),
            'change_amount'  => (float) ($this->latest_change ?? $this->change_amount),
            
            // 5. Status
            'payment_status' => $this->payment_status,
            'status'         => $this->status,
            
            // 6. Audit & Relasi (Gunakan optional untuk keamanan)
            // Jalur: Creator -> Employee -> Full Name
            'cashier'        => $this->creator?->employee?->full_name ?? 'System',
            'payment_method' => $this->initialPaymentMethod->name ?? '-',

            // 7. Waktu
            'order_date'     => $this->order_date ? $this->order_date->format('d M Y H:i') : '-',
            'human_date'     => $this->order_date ? $this->order_date->diffForHumans() : '-',
        ];
    }
}