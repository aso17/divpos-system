<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use App\Helpers\CryptoHelper;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
             'id'=> CryptoHelper::encrypt($this->id),
            'name' => $this->name,
            'short_name' => $this->short_name,
            'is_decimal' => (boolean) $this->is_decimal,
            'description' => $this->description,
        ];
    }
}