<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentRecapResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'invoice_no'          => $this->invoice_no,
            'order_date'          => $this->order_date,
            'customer_name'       => $this->customer_name,
            'customer_phone'      => $this->customer_phone,
            'outlet_name'         => $this->outlet_name,
            'grand_total'         => (float) $this->grand_total,
            'total_paid'          => (float) $this->total_paid,
            'remaining'           => (float) max(0, $this->grand_total - $this->total_paid),
            'payment_method_name' => $this->payment_method_name,
            'payment_status'      => $this->payment_status,
        ];
    }
}
