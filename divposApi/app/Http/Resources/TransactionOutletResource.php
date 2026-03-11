<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class TransactionOutletResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'      => CryptoHelper::encrypt($this->id),
            'name'    => $this->name,
            'code'    => $this->code,
            'address' => $this->address ?? '-',
            'is_main' => (bool) $this->is_main_branch,
        ];
    }
}