<?php

namespace App\Http\Resources;

use App\Helpers\CryptoHelper;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionDetailResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'             => CryptoHelper::encrypt($this->id),
            'package_id'     => $this->package_id ? CryptoHelper::encrypt($this->package_id) : null,
            'package_name'   => $this->package_name,
            'original_price' => (float) $this->original_price,
            'unit'           => $this->unit,
            'qty'            => (float) $this->qty,
            'price_per_unit' => (float) $this->price_per_unit,
            'subtotal'       => (float) $this->subtotal,

            // --- TAMBAHKAN DUA BARIS INI ---
            'employee_id'    => $this->employee_id ? CryptoHelper::encrypt($this->employee_id) : null,
            'employee_name'  => $this->employee_name ?? null,

            'notes'          => $this->notes,
        ];
    }
}
