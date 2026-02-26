<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LoginResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'        => $this->id,
            'full_name' => $this->full_name,
            'email'     => $this->email,
            'role_id'   => $this->role_id,
            'tenant_id' => $this->tenant_id,
            'avatar'    => $this->avatar,
            'tenant'    => [
                'slug'      => $this->tenant->slug ?? null,
                'code'      => $this->tenant->code ?? null,
                'logo_path' => $this->tenant->logo_path
                    ? asset("storage/{$this->tenant->logo_path}")
                    : null,
            ],
        ];
    }
}