<?php

namespace App\Repositories;

use App\Models\Ms_user;
use App\Models\UserRefreshToken;
use Illuminate\Support\Facades\DB;

class AuthRepository
{
    public function findForAuthentication(string $email)
    {
        return Ms_user::select(
                'Ms_users.id', 
                'Ms_users.email', 
                'Ms_users.username',
                'Ms_users.password', 
                'Ms_users.role_id', 
                'Ms_users.is_active as user_active',
                'Ms_users.tenant_id as user_tenant_id', // Alias biar jelas ini punya User (Owner)
                
                'Ms_employees.full_name',
                'Ms_employees.is_active as employee_active',
                'Ms_employees.tenant_id as employee_tenant_id', // Ini pegangan buat Staff
                
                'Ms_tenants.id as tenant_id', // ID Tenant yang "ketemu" (baik via Owner/Staff)
                'Ms_tenants.name as tenant_name',
                'Ms_tenants.slug as tenant_slug',
                'Ms_tenants.code as tenant_code',
                'Ms_tenants.logo_path as tenant_logo', 
                'Ms_tenants.is_active as tenant_active',
                'Ms_tenants.subscription_ends_at',
                'Ms_business_types.code as business_type_code',
                
                'Ms_roles.role_name',
                'Ms_roles.code as role_code'
            )
            // 1. Join Employee dulu supaya data tenant_id staff tersedia
            ->leftJoin('Ms_employees', 'Ms_users.id', '=', 'Ms_employees.user_id')
            
            // 2. 🎯 JOIN SAKTI: Menghubungkan tenant baik untuk Owner maupun Staff
            ->leftJoin('Ms_tenants', function($join) {
                $join->on('Ms_users.tenant_id', '=', 'Ms_tenants.id')
                    ->orOn('Ms_employees.tenant_id', '=', 'Ms_tenants.id');
            })
            
            ->leftJoin('Ms_business_types', 'Ms_tenants.business_type_id', '=', 'Ms_business_types.id')
            ->leftJoin('Ms_roles', 'Ms_users.role_id', '=', 'Ms_roles.id')
            
            ->where('Ms_users.email', $email)
            ->whereNull('Ms_users.deleted_at')
            // Kita tidak taruh where is_active di sini agar bisa kasih pesan error yang spesifik di Service
            ->first();
    }

    public function updateLoginMetadata(int $userId, string $ip): void
    {
        Ms_user::where('id', $userId)->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);
    }

    public function storeRefreshToken(array $data)
    {
        return UserRefreshToken::create([
            'user_id'     => $data['user_id'],
            'token'       => hash('sha256', $data['plain_token']),
            'device_name' => $data['device_name'],
            'ip_address'  => $data['ip_address'],
            'user_agent'  => $data['user_agent'],
            'expires_at'  => $data['expires_at'],
        ]);
    }

    public function findValidRefreshToken(string $plainToken)
    {
        $hashed = hash('sha256', $plainToken);
        return UserRefreshToken::with('user')
            ->where('token', $hashed)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    public function revokeRefreshToken(int $userId, string $plainToken): void
    {
        $hashed = hash('sha256', $plainToken);
        UserRefreshToken::where('user_id', $userId)
            ->where('token', $hashed)
            ->update(['revoked_at' => now()]);
    }
}