<?php

namespace App\Repositories;

use App\Models\Ms_user;

class UserRepository
{
    public function findActiveUserByEmail(string $email)
    {
       
        return Ms_user::select(
                'id', 
                'full_name', 
                'email', 
                'password', 
                'role_id', 
                'avatar', 
                'tenant_id'
            )
            ->with([
                'tenant:id,slug,logo_path,code', 
                'role:id,role_name'
            ])
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
        ->where('is_active', true)
        ->where('tenant_id', $tenantId);
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