<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

class RolePermissionRepository
{
    public static function getPermissionsByRole($roleId, $tenantId)
    {
        return DB::table('Ms_menus')
            ->join('Ms_modules as mod', 'Ms_menus.module_id', '=', 'mod.id')
            ->leftJoin('Ms_role_menu_permissions as rp', function ($join) use ($roleId, $tenantId) {
                $join->on('Ms_menus.id', '=', 'rp.menu_id')
                    ->where('rp.role_id', '=', $roleId)
                    ->where('rp.tenant_id', '=', $tenantId);
            })
            ->select(
                'Ms_menus.id as menu_id',
                'Ms_menus.menu_name',
                'Ms_menus.module_id',
                'Ms_menus.parent_id',
                'Ms_menus.route_name',
                'mod.module_name',
                'mod.icon as module_icon',
                // 🚩 PERBAIKAN: Gunakan FALSE (Boolean) bukan 0 (Integer) untuk COALESCE di Postgres
                DB::raw("COALESCE(rp.can_view, FALSE) as can_view"),
                DB::raw("COALESCE(rp.can_create, FALSE) as can_create"),
                DB::raw("COALESCE(rp.can_update, FALSE) as can_update"),
                DB::raw("COALESCE(rp.can_delete, FALSE) as can_delete"),
                DB::raw("COALESCE(rp.can_export, FALSE) as can_export")
            )
            ->orderBy('mod.order_no', 'asc')
            ->orderBy('Ms_menus.id', 'asc')
            ->get()
            ->map(function ($item) {
                // Flag untuk FE agar tahu baris mana yang tidak butuh checkbox
                $item->is_parent = empty($item->route_name);

                // Memastikan nilai return ke JSON benar-benar boolean (true/false)
                $item->can_view   = (bool) $item->can_view;
                $item->can_create = (bool) $item->can_create;
                $item->can_update = (bool) $item->can_update;
                $item->can_delete = (bool) $item->can_delete;
                $item->can_export = (bool) $item->can_export;

                return $item;
            });
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
