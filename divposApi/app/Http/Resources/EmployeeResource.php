<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class EmployeeResource extends JsonResource
{
   public function toArray(Request $request): array
{
   
    // Logic: Cek apakah data berasal dari Join atau Model Relation
    $roleName = $this->role_name ?? ($this->user->role->role_name ?? 'No Role');
    $roleCode = $this->role_code ?? ($this->user->role->code ?? 'NONE');
    $roleId   = $this->user_role_id ?? ($this->user->role_id ?? null);
    $email    = $this->user_email ?? ($this->user->email ?? null);
    $outletName = $this->outlet_name ?? ($this->outlet->name ?? 'Pusat/Global');

    return [
        'id'            => $this->employee_id ? CryptoHelper::encrypt($this->employee_id) : CryptoHelper::encrypt($this->id), 
        'full_name'     => $this->full_name ?? 'User Administratif',
        'employee_code' => $this->employee_code ?? '-',
        'phone'         => $this->phone ?? '-',
        'job_title'     => $this->job_title ?? ($roleName),
        'is_active'     => (bool) ($this->employee_active ?? $this->is_active ?? true),
        
        'user_id'     => CryptoHelper::encrypt($this->user_id),
        'email'       => $email,
        
        'role' => [
            'id'   => $roleId ? CryptoHelper::encrypt($roleId) : null,
            'name' => $roleName,
            'code' => $roleCode,
            ],
        
        'outlet' => [
            'id'   => ($this->outlet_id) ? CryptoHelper::encrypt($this->outlet_id) : null,
            'name' => $outletName, 
        ],
        
        'created_at' => $this->employee_created_at 
            ? \Carbon\Carbon::parse($this->employee_created_at)->format('Y-m-d H:i:s') 
            : ($this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null),
    ];
}
}