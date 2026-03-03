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
        return Ms_user::select(
                'Ms_users.id',
                'Ms_users.email',
                'Ms_users.username',
                'Ms_users.role_id',
                'Ms_users.avatar',
                'Ms_users.created_at',
                // Data dari join Ms_employees
                'Ms_employees.full_name', 
                'Ms_employees.phone',
                'Ms_employees.tenant_id',
                'Ms_employees.is_active' // Ambil status aktif dari sini
            )
            ->join('Ms_employees', 'Ms_users.id', '=', 'Ms_employees.user_id')
            ->with(['role:id,role_name,code'])
            // Filter berdasarkan tenant si karyawan
            ->where('Ms_employees.tenant_id', $tenantId)
            // Jika Mas ingin query dasar ini hanya menampilkan yang aktif:
            ->where('Ms_employees.is_active', true);
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