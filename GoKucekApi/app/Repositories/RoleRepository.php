<?php

namespace App\Repositories;

use App\Models\Ms_role;

class RoleRepository
{
    public function getBaseQuery(int $tenantId)
    {
        return Ms_role::where('tenant_id', $tenantId);
    }

    public function getActiveRoles(int $tenantId)
    {
        return $this->getBaseQuery($tenantId)
            ->select('id', 'role_name', 'code')
            ->where('is_active', true)
            ->orderBy('role_name')
            ->get();
    }
}