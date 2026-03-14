<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class TransactionPaymentMethodResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            // ID dienkripsi agar aman
            'id'             => CryptoHelper::encrypt($this->id),
            
            'name'           => $this->name,
            'code'           => $this->code,
            'type'           => $this->type,
            
            // Logic Flag untuk Frontend (Wajib di-cast ke bool)
            'is_cash'        => (bool) $this->is_cash,
            'is_dp_enabled'  => (bool) $this->is_dp_enabled,
            'allow_zero_pay' => (bool) $this->allow_zero_pay,
            'is_default'     => (bool) $this->is_default,
        ];
    }
}