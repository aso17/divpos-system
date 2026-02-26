<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleMenuPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil data Role lengkap dengan tenant_id-nya
        $roles = DB::table('Ms_roles')->get(); 
        $menus = DB::table('Ms_menus')->get();
        $now = Carbon::now();

        foreach ($roles as $role) {
            foreach ($menus as $menu) {
                
                // Identifikasi Menu Sensitif
                $isSettingMenu = in_array($menu->code, ['SET_PARENT', 'SET_USER', 'SET_ROLE', 'SET_APP']);

                // Default Permission (Kosong)
                $permission = [
                    'can_view'   => false,
                    'can_create' => false,
                    'can_update' => false,
                    'can_delete' => false,
                    'can_export' => false,
                ];

                // Logika Pembagian Hak Akses berdasarkan Role Code
                if ($role->code === 'SUPER_ADMIN') {
                    $permission = [
                        'can_view'   => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'can_export' => true,
                    ];
                } 
                elseif ($role->code === 'ADMIN') {
                    $permission = [
                        'can_view'   => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => true,
                        'can_export' => false,
                    ];
                } 
                elseif ($role->code === 'KASIR') {
                    if (!$isSettingMenu) {
                        $permission = [
                            'can_view'   => true,
                            'can_create' => true,
                            'can_update' => false,
                            'can_delete' => false,
                            'can_export' => false,
                        ];
                    }
                } 
                elseif ($role->code === 'OWNER') {
                    if (!$isSettingMenu) {
                        $permission = [
                            'can_view'   => true,
                            'can_create' => false,
                            'can_update' => false,
                            'can_delete' => false,
                            'can_export' => true,
                        ];
                    }
                }

                // Update atau Insert dengan Tenant Awareness
                DB::table('Ms_role_menu_permissions')->updateOrInsert(
                    [
                        'tenant_id' => $role->tenant_id, // WAJIB: Ambil dari role-nya
                        'role_id'   => $role->id,
                        'menu_id'   => $menu->id,
                    ],
                    [
                        'module_id'  => $menu->module_id,
                        'is_active'  => true,
                        'created_by' => 'SYSTEM',
                        'created_at' => $now,
                        'updated_at' => $now,
                        ...$permission,
                    ]
                );
            }
        }
    }
}