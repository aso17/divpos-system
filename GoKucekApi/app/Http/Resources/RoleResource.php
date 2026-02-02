<?php

namespace App\Http\Resources;

use App\Helpers\CryptoHelper;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'        => $this->id,
            'role_name' => $this->role_name,
            'code'      => $this->code,
            'is_active' => (bool) $this->is_active,
            'description' => $this->description,
            // Tambahkan field lain jika perlu
        ];
    }
}