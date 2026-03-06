<?php

namespace App\Services;

use App\Repositories\RolePermissionRepository;
use Illuminate\Support\Facades\Auth;

class RolePermissionService
{
    protected $repository;

    public function __construct(RolePermissionRepository $repository)
    {
        $this->repository = $repository;
    }

   public function getRoleWithPermissions($roleId)
    {
        $tenantId = Auth::user()->tenant_id;
        $cleanRoleId = (int) $roleId;
        // 1. Ambil Info Role
        $role = $this->repository->getRoleInfo($cleanRoleId, $tenantId);

        // 2. Ambil Daftar Permissions
        $permissions = $this->repository->getPermissionsByRole($cleanRoleId, $tenantId);

        return [
            'role' => $role,
            'permissions' => $permissions
        ];
    }
  public function syncPermissions($roleId, array $rawPermissions)
{
    $user = Auth::user();
    $userId = Auth::id(); // Ambil ID di luar loop agar cepat
    $now = now();
    $cleanRoleId = (int) $roleId;

    $preparedData = collect($rawPermissions)->map(function ($p) use ($cleanRoleId, $user, $userId, $now) {
        return [
            'tenant_id'  => $user->tenant_id,
            'role_id'    => $cleanRoleId,
            'module_id'  => $p['module_id'],
            'menu_id'    => $p['menu_id'],
            'can_view'   => filter_var($p['can_view'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
            'can_create' => filter_var($p['can_create'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
            'can_update' => filter_var($p['can_update'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
            'can_delete' => filter_var($p['can_delete'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
            'can_export' => filter_var($p['can_export'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
            'is_active'  => 1,
            'created_by' => (string) $userId, 
            'created_at' => $now,
            'updated_at' => $now,
        ];
    })->toArray();

    return $this->repository->updateRolePermissions($cleanRoleId, $user->tenant_id, $preparedData);
}
}