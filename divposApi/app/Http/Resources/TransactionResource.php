<?php

namespace App\Http\Resources;

use App\Helpers\CryptoHelper;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray($request)
    {
        $user=Auth::user()->employee->full_name;

        return [
            'id'                => CryptoHelper::encrypt($this->id),
            'invoice_no'        => $this->invoice_no,
            'tenant_id'         => CryptoHelper::encrypt($this->tenant_id),
            'outlet_id'         => CryptoHelper::encrypt($this->outlet_id),
            
            // Customer Info
            'customer_id'       => $this->customer_id ? CryptoHelper::encrypt($this->customer_id) : null,
            'customer_name'     => $this->customer_name,
            'customer_phone'    => $this->customer_phone,

            // Financials
            'total_base_price'  => (float) $this->total_base_price,
            'grand_total'       => (float) $this->grand_total,
            'payment_amount'    => (float) $this->payment_amount,
            'change_amount'     => (float) $this->change_amount,
            'total_paid'        => (float) $this->total_paid,

            // Status
            'status'            => $this->status,
            'payment_status'    => $this->payment_status,
            'order_date'        => $this->order_date,

            // Relations (Menggunakan Resource lain jika sudah ada)
            'details'           => TransactionDetailResource::collection($this->whenLoaded('details')),
            'outlet'            => new OutletResource($this->whenLoaded('outlet')),
            'payment_method'    => new PaymentMethodResource($this->whenLoaded('initialPaymentMethod')),
            
            'created_by'        => $user,
            'created_at'        => $this->created_at,
        ];
    }
}