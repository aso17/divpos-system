<?php

namespace App\Repositories;

use App\Models\Ms_user;

class UserRepository
{
    public function findActiveUserByEmail(string $email)
    {
        return Ms_user::select('id', 'full_name', 'email', 'password', 'role_id', 'avatar', 'tenant_id')
            ->with(['tenant:id,slug,logo_path,code'])
            ->where('email', $email)
            ->where('is_active', true)
            ->first();
    }


    public function getBaseUserQuery(int $tenantId)
    {
        return Ms_user::select(
            'id','full_name','email','username','phone',
            'is_active','role_id','tenant_id','avatar','created_at'
        )
        ->with(['role:id,role_name,code', 'tenant:id,slug,code'])
        ->where('tenant_id', $tenantId);
    }
}