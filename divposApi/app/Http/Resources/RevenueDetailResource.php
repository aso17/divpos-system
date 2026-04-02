<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RevenueDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'package_id'    => $this->package_id,
            'package_name'  => $this->package_name,
            'employee_id'   => $this->employee_id,
            'employee_name' => $this->employee_name,
            'qty'           => (float) $this->qty,
            'unit'          => $this->unit,
            'price_per_unit' => (float) $this->price_per_unit,
            'subtotal'      => (float) $this->subtotal,
            'notes'         => $this->notes,
        ];
    }
}
