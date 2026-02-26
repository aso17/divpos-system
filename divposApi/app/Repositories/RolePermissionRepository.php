<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

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

    public static function updateRolePermissions($roleId, $tenantId, array $dataToInsert)
    {
        return DB::transaction(function () use ($roleId, $tenantId, $dataToInsert) {
            
            DB::table('Ms_role_menu_permissions')
                ->where('tenant_id', $tenantId)
                ->where('role_id', $roleId)
                ->delete();

            // 2. Insert yang baru (jika ada)
            if (!empty($dataToInsert)) {
                DB::table('Ms_role_menu_permissions')->insert($dataToInsert);
            }
            
            return true;
        });
    }
}