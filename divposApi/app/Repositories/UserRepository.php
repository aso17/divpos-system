<?php

namespace App\Repositories;

use App\Models\Ms_user;
use App\Models\Ms_employee;

class UserRepository
{
   
    public function findAvailableEmployees($tenantId)
    {
        return Ms_employee::whereNull('user_id')
        ->where('tenant_id', $tenantId)
        ->where('is_active', true)
        ->select('id', 'full_name','phone','job_title', 'tenant_id')
        ->get();
    }

    public function getBaseUserQuery(int $tenantId)
    {
        return Ms_user::query()
            ->select([
                'Ms_users.id',
                'Ms_users.email',
                'Ms_users.username',
                'Ms_users.role_id',
                'Ms_users.tenant_id as user_tenant_id', 
                'Ms_users.avatar',
                'Ms_users.is_active as user_active',
                'Ms_users.created_at',               
                'Ms_employees.full_name', 
                'Ms_employees.phone',
                'Ms_employees.job_title',
                'Ms_employees.is_active as employee_status',
                'Ms_employees.tenant_id as employee_tenant_id', 
                'Ms_roles.role_name',
                'Ms_roles.code as role_code'
            ])
           
            ->leftJoin('Ms_employees', 'Ms_users.id', '=', 'Ms_employees.user_id')
            
            // 2. Join Role
            ->leftJoin('Ms_roles', 'Ms_users.role_id', '=', 'Ms_roles.id')
            
            ->where(function($query) use ($tenantId) {
                $query->where('Ms_users.tenant_id', $tenantId) // Ini ambil si Owner
                    ->orWhere('Ms_employees.tenant_id', $tenantId); // Ini ambil semua Staff-nya
            })
            
            ->whereNull('Ms_users.deleted_at')
            ->orderBy('Ms_users.created_at', 'desc');
    }

   public function findById(int $id)
    {
        return Ms_user::where('id', $id)
            
            ->first();
    }

    public function create(array $data)
    {
        $user = Ms_user::create($data);
        return $user->load('role'); 
    }

    public function update(Ms_user $user, array $data)
    {
        $user->update($data);
        return $user->fresh(['role']); 
    }

    public function delete(Ms_user $user)
    {
        return $user->delete();
    }

    public function updateLoginInfo(Ms_user $user, string $ip)
    {
        return $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);
    }

    public function findByRefreshToken(string $hashedToken)
    {
        return Ms_user::where('refresh_token', $hashedToken)->first();
    }
}