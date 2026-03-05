<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class AuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        
        return [
           
            'id'        => $this->id ? CryptoHelper::encrypt($this->id) : null,
            'email'     => $this->email,
            'username'  => $this->username,
            'full_name' => $this->full_name ?? 'User', 
            
            'role' => [
                'name' => $this->role->role_name ?? null,
                'code' => $this->role->code ?? null,
            ],

            'avatar' => $this->avatar 
                ? asset('storage/' . $this->avatar) 
                : asset('assets/images/default-avatar.png'),

           'tenant' => $this->tenant_id ? [
                    'id'            => CryptoHelper::encrypt($this->tenant_id),
                    'name'          => $this->tenant_name,
                    'slug'          => $this->tenant_slug,
                    'code'          => $this->tenant_code,
                    'business_type' => $this->business_type_code,
                    'logo'          => $this->tenant_logo 
                                        ? asset('storage/' . ltrim($this->tenant_logo, '/')) 
                                        : asset('assets/images/default-tenant-logo.png'),
                ] : null,

            
            'outlet' => $this->when(isset($this->outlet_id) || ($this->relationLoaded('employee') && $this->employee?->outlet_id), function() {
                $oid = $this->outlet_id ?? $this->employee->outlet_id;
                return [
                    'id'   => CryptoHelper::encrypt($oid),
                    'name' => $this->outlet_name ?? ($this->employee->outlet->name ?? null),
                ];
            }),
        ];
    }
}