<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class TransactionServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'   => CryptoHelper::encrypt($this->id),
            'name' => $this->name,
        ];
    }
}
