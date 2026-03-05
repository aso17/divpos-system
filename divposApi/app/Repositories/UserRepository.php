<?php

namespace App\Repositories;

use App\Models\Ms_user;

class UserRepository
{
   public function findActiveUserByEmail(string $email)
    {
        return Ms_user::select(
                'Ms_users.id', 
                'Ms_users.email', 
                'Ms_users.password', 
                'Ms_users.role_id', 
                'Ms_users.avatar',
                'Ms_employees.full_name',
                'Ms_employees.tenant_id',
                'Ms_employees.is_active' ,
                'Ms_tenants.slug as tenant_slug',
                'Ms_tenants.code as tenant_code',
                'Ms_tenants.logo_path as tenant_logo'
            )
            ->join('Ms_employees', 'Ms_users.id', '=', 'Ms_employees.user_id')
            ->join('Ms_tenants', 'Ms_employees.tenant_id', '=', 'Ms_tenants.id') // Join ke tenant lewat employee
            ->with(['role:id,role_name'])
            ->where('Ms_users.email', $email)
            ->where('Ms_employees.is_active', true)
            ->first();
    }

  public function getBaseUserQuery(int $tenantId)
    {
        return Ms_user::query()
            ->select([
                'Ms_users.id',
                'Ms_users.email',
                'Ms_users.username',
                'Ms_users.role_id',
                'Ms_users.tenant_id', // Tambahkan ini untuk debugging
                'Ms_users.avatar',
                'Ms_users.created_at',              
                'Ms_employees.full_name', 
                'Ms_employees.phone',
                'Ms_employees.is_active as employee_status',
                'Ms_roles.role_name',
                'Ms_roles.code as role_code'
            ])
            // Gunakan leftJoin agar User tetap muncul walau data Employee belum ada
            ->leftJoin('Ms_employees', function($join) use ($tenantId) {
                $join->on('Ms_users.id', '=', 'Ms_employees.user_id')
                    ->where('Ms_employees.tenant_id', '=', $tenantId);
            })
            // Join ke roles (Gunakan leftJoin jika ada kemungkinan role belum diset)
            ->leftJoin('Ms_roles', function($join) use ($tenantId) {
                $join->on('Ms_users.role_id', '=', 'Ms_roles.id')
                    ->where('Ms_roles.tenant_id', '=', $tenantId); 
            })
            // Filter Utama: Cukup di tabel Users saja untuk keamanan
            ->where('Ms_users.tenant_id', $tenantId)
            // Jika ingin melihat semua user (termasuk yang non-aktif), matikan baris ini:
            // ->where('Ms_employees.is_active', true) 
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