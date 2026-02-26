<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class LoginResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'full_name' => $this->full_name,
            'email'     => $this->email,
            'role_name' => $this->role->role_name ?? 'User', 
            'tenant_id' => $this->tenant_id,
            'avatar'    => $this->avatar 
                ? asset('storage/' . $this->avatar) 
                : null,
            

            // Gunakan conditional loading untuk tenant
            'tenant' => $this->whenLoaded('tenant', function() {
                return [
                    'id'        => $this->tenant_id,
                    'slug'      => $this->tenant->slug,
                    'code'      => $this->tenant->code,
                    'name'      => $this->tenant->name ?? null, // Tambahkan name jika perlu
                    'logo_path' => $this->tenant->logo_path
                        ? asset('storage/' . $this->tenant->logo_path)
                        : null,
                ];
            }),
        ];
    }
}