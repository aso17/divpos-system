<?php

namespace App\Services;

use App\Repositories\RoleRepository;
use App\Helpers\CryptoHelper;
use Exception;

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

    public function createRole(array $data)
    {
       
        $exists = $this->roleRepo->checkCodeExists($data['tenant_id'], $data['code']);
        
        if ($exists) {
            throw new Exception("Role code '{$data['code']}' already exists in this tenant.");
        }

        // 2. Simpan lewat Repo
        return $this->roleRepo->create($data);
    }

    public function updateRole($id, array $data)
    {
        // Jika kode diupdate, cek duplikasi kecuali untuk ID ini sendiri
        if (isset($data['code']) && isset($data['tenant_id'])) {
            $exists = $this->roleRepo->checkCodeExists($data['tenant_id'], $data['code'], $id);
            if ($exists) {
                throw new Exception("Role code '{$data['code']}' already exists.");
            }
        }

        return $this->roleRepo->update($id, $data);
    }

    public function deleteRole($id, $tenantId)
    {
        
        $role = $this->roleRepo->findByIdAndTenant($id, (int)$tenantId);
        if (!$role) {
            throw new Exception("Role not found or access denied.");
        }

        return $this->roleRepo->delete($id);
    }
}