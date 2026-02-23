<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentMethodResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type, // CASH, TRANSFER, E-WALLET
            'account_number' => $this->account_number ?? '-',
            'account_name' => $this->account_name ?? '-',
            'description' => $this->description,
            'is_active' => (bool)$this->is_active,
            'created_at_label' => $this->created_at ? $this->created_at->format('d M Y') : '-',
        ];
    }
}