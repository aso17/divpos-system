<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class TransactionHistoryResource extends JsonResource
{
    public function toArray($request)
    {
        // 1. Logic Sisa Tagihan (Cegah angka negatif)
        $remaining = (float) $this->grand_total - (float) $this->total_paid;

        return [
            'id'             => CryptoHelper::encrypt($this->id),
            'invoice_no'     => $this->invoice_no,
            'queue_number'   => $this->queue_number
                                ? str_pad($this->queue_number, 2, '0', STR_PAD_LEFT)
                                : '00',

            // 2. Customer Info
            'customer_name'  => $this->customer_name ?? 'Pelanggan Umum',
            'customer_phone' => $this->customer_phone ?? '-',

            // 3. Finansial (Pastikan casting ke float agar JS tidak menganggapnya String)
            'grand_total'    => (float) $this->grand_total,
            'total_paid'     => (float) $this->total_paid,
            'remaining_bill' => $remaining > 0 ? $remaining : 0,

            // Ambil nominal pembayaran terakhir atau default awal
            'payment_amount' => (float) ($this->latest_payment ?? $this->payment_amount),
            'change_amount'  => (float) ($this->latest_change ?? $this->change_amount),

            // 4. Status & Alasan (SANGAT PENTING untuk Modal Detail)
            'status'         => $this->status,
            'payment_status' => $this->payment_status,

            // Tambahkan NOTES agar alasan pembatalan muncul di Frontend
            'notes'          => $this->notes,

            // 5. Relasi & Audit
            // Pakai whenLoaded agar List History tidak berat (N+1 Protection)
            'details'        => TransactionDetailResource::collection($this->whenLoaded('details')),
            'outlet'         => $this->whenLoaded('outlet', function () {
                return new OutletResource($this->outlet);
            }),

            // Nama Kasir (Gunakan optional chaining)
            'cashier'        => $this->creator?->employee?->full_name ?? 'System',
            'payment_method' => $this->initialPaymentMethod->name ?? '-',

            // 6. Waktu
            'order_date'     => $this->order_date ? $this->order_date->format('d M Y H:i') : '-',
            'human_date'     => $this->order_date ? $this->order_date->diffForHumans() : '-',
            // Gunakan optional (?) agar jika null tidak crash, atau kembalikan null/string kosong
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
        ];
    }
}
