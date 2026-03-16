<?php

namespace App\Http\Resources;

use App\Helpers\CryptoHelper;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
   // TransactionResource.php
    public function toArray($request)
    {
        // Ambil nama kasir yang sedang login atau dari relasi creator
        $cashierName = $this->creator->employee->full_name ?? Auth::user()->employee->full_name;

        return [
            'id'                => CryptoHelper::encrypt($this->id),
            'invoice_no'        => $this->invoice_no,
            'queue_number' => $this->queue_number 
                            ? str_pad($this->queue_number, 2, '0', STR_PAD_LEFT) 
                            : '00',
            
            // Customer Info
            'customer_name'     => $this->customer_name,
            'customer_phone'    => $this->customer_phone,

            // Financials
            'grand_total'       => (float) $this->grand_total,
            'payment_amount'    => (float) $this->payment_amount,
            'change_amount'     => (float) $this->change_amount,
            'total_paid'        => (float) $this->total_paid,

            // Status
            'status'            => $this->status,
            'payment_status'    => $this->payment_status,
            
            // SAMAKAN DISINI: Format order_date menjadi string
            'order_date'        => $this->order_date ? $this->order_date->format('d M Y H:i') : $this->created_at->format('d M Y H:i'),

            // Relations
            'details'           => TransactionDetailResource::collection($this->whenLoaded('details')),
            'outlet'            => new OutletResource($this->whenLoaded('outlet')),
            
            // SAMAKAN DISINI: Gunakan key 'payment_method' langsung berupa string nama
            'payment_method'    => $this->initialPaymentMethod->name ?? '-',
            
            // SAMAKAN DISINI: Gunakan key 'cashier'
            'cashier'           => $cashierName,
        ];
    }
}