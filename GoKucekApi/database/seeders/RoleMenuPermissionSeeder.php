<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleMenuPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = DB::table('Ms_roles')->pluck('id', 'code');
        $menus = DB::table('Ms_menus')->get();

        foreach ($roles as $roleCode => $roleId) {
            foreach ($menus as $menu) {

                // 🎯 Default: no access
                $permission = [
                    'can_view'   => false,
                    'can_create' => false,
                    'can_update' => false,
                    'can_delete' => false,
                    'can_export' => false,
                ];

                // 🔥 SUPER ADMIN = FULL ACCESS SEMUA MENU
                if ($roleCode === 'SUPER_ADMIN') {
                    $permission = [
                        'can_view'   => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'can_export' => true,
                    ];
                }

                // ADMIN
                elseif ($roleCode === 'ADMIN') {
                    $permission = [
                        'can_view'   => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'can_export' => false,
                    ];
                }

                // KASIR
                elseif ($roleCode === 'KASIR') {
                    $permission = [
                        'can_view'   => true,
                        'can_create' => true,
                        'can_update' => false,
                        'can_delete' => false,
                        'can_export' => false,
                    ];
                }

                // OWNER
                elseif ($roleCode === 'OWNER') {
                    $permission = [
                        'can_view'   => true,
                        'can_create' => false,
                        'can_update' => false,
                        'can_delete' => false,
                        'can_export' => true,
                    ];
                }

                DB::table('Ms_role_menu_permissions')->updateOrInsert(
                    [
                        'role_id' => $roleId,
                        'menu_id' => $menu->id,
                    ],
                    [
                        'module_id'  => $menu->module_id,
                        'is_active'  => true,
                        'created_by' => 'SYSTEM',
                        'created_at' => now(),
                        'updated_at' => now(),
                        ...$permission,
                    ]
                );
            }
        }
    }
}
