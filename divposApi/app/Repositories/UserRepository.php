<?php

namespace App\Repositories;

use App\Models\Ms_user;

class UserRepository
{
   

    public function getBaseUserQuery(int $tenantId)
    {
        return Ms_user::query()
            ->select([
                'Ms_users.id',
                'Ms_users.email',
                'Ms_users.username',
                'Ms_users.role_id',
                'Ms_users.tenant_id as user_tenant_id', // Tanda Owner
                'Ms_users.avatar',
                'Ms_users.is_active as user_active',
                'Ms_users.created_at',               
                'Ms_employees.full_name', 
                'Ms_employees.phone',
                'Ms_employees.is_active as employee_status',
                'Ms_employees.tenant_id as employee_tenant_id', // Tanda Staff
                'Ms_roles.role_name',
                'Ms_roles.code as role_code'
            ])
            // 1. Join Employee (Wajib karena Staff ada di sini)
            ->leftJoin('Ms_employees', 'Ms_users.id', '=', 'Ms_employees.user_id')
            
            // 2. Join Role
            ->leftJoin('Ms_roles', 'Ms_users.role_id', '=', 'Ms_roles.id')
            
            // 3. FILTER SAKTI: Ambil yang tenant_id-nya cocok di Users OR di Employees
            ->where(function($query) use ($tenantId) {
                $query->where('Ms_users.tenant_id', $tenantId) // Ini ambil si Owner
                    ->orWhere('Ms_employees.tenant_id', $tenantId); // Ini ambil semua Staff-nya
            })
            
            ->whereNull('Ms_users.deleted_at')
            ->orderBy('Ms_users.created_at', 'desc');
    }
   public function findByIdAndTenant(int $id, int $tenantId)
    {
        return Ms_user::where('id', $id)
            ->where('tenant_id', $tenantId)
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