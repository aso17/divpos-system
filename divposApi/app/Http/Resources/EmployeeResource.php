<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class EmployeeResource extends JsonResource
{
   public function toArray(Request $request): array
{
    return [
        'id'            => CryptoHelper::encrypt($this->id), 
        'full_name'     => $this->full_name,
        'employee_code' => $this->employee_code,
        'phone'         => $this->phone,
        'job_title'     => $this->job_title,
        'is_active'     => (bool) $this->is_active,
        
        'outlet' => [
            // Cek $this->outlet_id (dari join) atau $this->outlet->id (dari load)
            'id'   => ($this->outlet_id ?? ($this->outlet->id ?? null)) 
                     ? CryptoHelper::encrypt($this->outlet_id ?? $this->outlet->id) 
                     : null,
            // Cek alias outlet_name (dari join) atau properti name (dari load)
            'name' => $this->outlet_name ?? ($this->outlet->name ?? 'Pusat'), 
        ],
        
        'has_login' => !empty($this->user_id),
        
        // Cek alias user_email (dari join) atau properti email (dari load)
        'email'     => $this->user_email ?? ($this->user->email ?? null),
        
        // Cek alias user_role_id (dari join) atau properti role_id (dari load)
        'role_id'   => ($this->user_role_id ?? ($this->user->role_id ?? null)) 
                       ? CryptoHelper::encrypt($this->user_role_id ?? $this->user->role_id) 
                       : null,
        
        'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
    ];
}
}