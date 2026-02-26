<?php

namespace App\Services;

use App\Repositories\RolePermissionRepository;

class RolePermissionService
{
    public function getPermissionsByRole($roleId, $tenantId)
    {
        
        $permissions = RolePermissionRepository::getPermissionsByRole($roleId, $tenantId);

        if ($permissions->isEmpty()) {
            // Log::info("No permissions found for role $roleId");
        }

        return $permissions;
    }
}