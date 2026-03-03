<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class LoginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => CryptoHelper::encrypt($this->id),
            // Langsung ambil dari hasil join (tidak perlu lewat relasi ->employee)
            'full_name' => $this->full_name ?? 'User', 
            'email'     => $this->email,
            'username'  => $this->username,
            'role_name' => $this->role->role_name ?? null,            
            // Ambil tenant_id hasil join
            'tenant_id' => $this->tenant_id ? CryptoHelper::encrypt($this->tenant_id) : null,
            
            'avatar'    => $this->avatar 
                ? asset('storage/' . $this->avatar) 
                : asset('assets/images/default-avatar.png'),

            // Mapping data Tenant dari hasil alias Join (tenant_slug, tenant_code, dll)
            'tenant' => [
                'id'    => CryptoHelper::encrypt($this->tenant_id),
                'slug'  => $this->tenant_slug, // Sesuai alias di query
                'code'  => $this->tenant_code, // Sesuai alias di query
                'logo'  => $this->tenant_logo 
                           ? asset('storage/' . $this->tenant_logo) 
                           : null,
            ],

            // Outlet tetap gunakan 'when' jika ada relasi outlet yang di-load
            'outlet' => $this->when($this->relationLoaded('employee') && $this->employee->outlet_id, function() {
                return [
                    'id'   => CryptoHelper::encrypt($this->employee->outlet_id),
                    'name' => $this->employee->outlet->name ?? null,
                ];
            }),
        ];
    }
}