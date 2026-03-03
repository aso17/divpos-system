<?php

namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class RoleResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'        => CryptoHelper::encrypt($this->id),
            'role_name' => $this->role_name,
            'code'      => $this->code,
            'is_active' => (bool) $this->is_active,
            'description' => $this->description,
            // Tambahkan field lain jika perlu
        ];
    }
}