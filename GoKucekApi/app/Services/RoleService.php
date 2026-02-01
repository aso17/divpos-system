<?php

namespace App\Services;

use App\Repositories\RoleRepository;
use App\Helpers\CryptoHelper;

class RoleService
{
    protected $roleRepo;

    public function __construct(RoleRepository $roleRepo)
    {
        $this->roleRepo = $roleRepo;
    }

    public function getRolesForDropdown($encryptedTenantId)
    {
        $tenantId = CryptoHelper::decrypt($encryptedTenantId);
        if (!$tenantId) return collect();

        return $this->roleRepo->getActiveRoles((int)$tenantId);
    }

    public function getPaginatedRoles(array $params)
    {
        $tenantId = CryptoHelper::decrypt($params['tenant_id'] ?? null);
        if (!$tenantId) return null;

        $query = $this->roleRepo->getBaseQuery((int)$tenantId);

        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->where('role_name', 'like', "%{$keyword}%")
                  ->orWhere('code', 'like', "%{$keyword}%");
            });
        }

        return $query->orderBy('created_at', 'desc');
    }
}