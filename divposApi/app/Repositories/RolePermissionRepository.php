<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use App\Models\Ms_role_menu_permission;

class RolePermissionRepository
{
    public static function getPermissionsByRole($roleId, $tenantId)
    {
        return DB::table('Ms_menus')
            ->join('Ms_modules as mod', 'Ms_menus.module_id', '=', 'mod.id')
            ->leftJoin('Ms_role_menu_permissions as rp', function($join) use ($roleId, $tenantId) {
                $join->on('Ms_menus.id', '=', 'rp.menu_id')
                    ->where('rp.role_id', '=', $roleId)
                    ->where('rp.tenant_id', '=', $tenantId);
            })
            ->select(
                'Ms_menus.id as menu_id',
                'Ms_menus.menu_name',
                'Ms_menus.module_id',
                'mod.module_name',
                'mod.icon as module_icon',
                DB::raw("COALESCE(rp.can_view, false) as can_view"),
                DB::raw("COALESCE(rp.can_create, false) as can_create"),
                DB::raw("COALESCE(rp.can_update, false) as can_update"),
                DB::raw("COALESCE(rp.can_delete, false) as can_delete"),
                DB::raw("COALESCE(rp.can_export, false) as can_export")
            )
            ->orderBy('mod.order_no', 'asc')
            ->orderBy('Ms_menus.id', 'asc')
            ->get();
    }

    
    public function getRoleInfo($roleId, $tenantId)
    {
        return DB::table('Ms_roles')
            ->where('id', (int) $roleId)
            ->where('tenant_id', (int) $tenantId)
            ->first(['role_name', 'code']);
    }

    public function updateRolePermissions($roleId, $tenantId, array $data)
        {
            return DB::transaction(function () use ($data) {
                foreach ($data as $item) {
                    // Gunakan updateOrInsert untuk efisiensi
                    DB::table('Ms_role_menu_permissions')->updateOrInsert(
                        [
                            // Kondisi Pengecekan (Unique Keys)
                            'tenant_id' => $item['tenant_id'],
                            'role_id'   => $item['role_id'],
                            'menu_id'   => $item['menu_id'],
                        ],
                        [
                            // Data yang akan di-update atau di-insert
                            'module_id'  => $item['module_id'],
                            'can_view'   => $item['can_view'],
                            'can_create' => $item['can_create'],
                            'can_update' => $item['can_update'],
                            'can_delete' => $item['can_delete'],
                            'can_export' => $item['can_export'],
                            'is_active'  => $item['is_active'],
                            'created_by' => $item['created_by'],
                            'updated_at' => now(), // Selalu update waktu perubahan
                        ]
                    );
                }
                return true;
            });
        }
}