<?php

namespace App\Http\Resources;

use App\Helpers\CryptoHelper;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray($request)
    {
        // Ambil nama kasir
        $cashierName = $this->creator->employee->full_name ?? Auth::user()->employee->full_name ?? 'System';

        // LOGIC FALLBACK: Jika payment_amount 0 tapi ada DP, gunakan DP sebagai nominal bayar utama
        $displayPayment = (float) $this->payment_amount;
        if ($displayPayment <= 0 && $this->dp_amount > 0) {
            $displayPayment = (float) $this->dp_amount;
        }

        return [
            'id'                => CryptoHelper::encrypt($this->id),
            'invoice_no'        => $this->invoice_no,
            'queue_number'      => $this->queue_number
                                    ? str_pad($this->queue_number, 2, '0', STR_PAD_LEFT)
                                    : '00',

            // Customer Info
            'customer_name'     => $this->customer_name,
            'customer_phone'    => $this->customer_phone,

            // Financials
            'grand_total'       => (float) $this->grand_total,

            // Perbaikan: Sekarang payment_amount akan selalu berisi angka (DP atau Bayar Cash)
            'payment_amount'    => $displayPayment,

            'dp_amount'         => (float) $this->dp_amount, // Tambahkan ini agar FE tahu jika ada DP
            'change_amount'     => (float) $this->change_amount,
            'total_paid'        => (float) $this->total_paid,
            'remaining_bill'    => (float) ($this->grand_total - $this->total_paid), // Bonus: Sisa tagihan

            // Status
            'status'            => $this->status,
            'payment_status'    => $this->payment_status,

            // Format order_date
            'order_date'        => $this->order_date ? $this->order_date->format('d M Y H:i') : $this->created_at->format('d M Y H:i'),

            // Relations
            'details'           => TransactionDetailResource::collection($this->whenLoaded('details')),
            'outlet'            => new OutletResource($this->whenLoaded('outlet')),

            'payment_method'    => $this->initialPaymentMethod->name ?? '-',
            'cashier'           => $cashierName,
        ];
    }
}
