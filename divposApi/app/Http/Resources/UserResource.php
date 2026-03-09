<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;
use Carbon\Carbon;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        
        $id = $this->id;
        $tenantId = $this->user_tenant_id ?? ($this->employee_tenant_id ?? ($this->tenant_id ?? ($this->employee->tenant_id ?? null)));

        $fullName = $this->full_name ?? ($this->employee->full_name ?? '-');
        $phone    = $this->phone ?? ($this->employee->phone ?? '-');
        $job_title    = $this->job_title ?? ($this->employee->job_title ?? '-');

        $isActive = $this->user_active ?? ($this->is_active ?? ($this->employee_status ?? false));

        // 4. Logic Role
        $roleName = $this->role_name ?? ($this->role->role_name ?? 'Super Admin');
        $roleCode = $this->role_code ?? ($this->role->code ?? 'NONE');
        $roleId   = $this->role_id ?? ($this->role->id ?? null);

        return [
            'id'         => CryptoHelper::encrypt($id), 
            'full_name'  => $fullName,
            'email'      => $this->email,
            'username'   => $this->username,
            'phone'      => $phone,
            'job_title'=>$job_title,
            'avatar'     => $this->avatar ? asset('storage/' . $this->avatar) : null,
            'is_active'  => (bool) $isActive,
            
            'role' => [
                'id'   => $roleId ? CryptoHelper::encrypt($roleId) : null,
                'name' => $roleName,
                'code' => $roleCode,
            ],

            'tenant' => [
                'id' => $tenantId ? CryptoHelper::encrypt($tenantId) : null,
            ],

            'meta' => [
                'is_owner' => $roleCode === 'OWNER',
                'is_staff' => in_array($roleCode, ['ADMIN', 'KASIR', 'STAFF', 'ADM']),
                'has_employee_profile' => $this->relationLoaded('employee') || isset($this->full_name),
            ],
            
            'created_at' => $this->created_at 
                ? Carbon::parse($this->created_at)->format('Y-m-d H:i:s') 
                : null,
        ];
    }
}