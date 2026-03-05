<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleMenuPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil semua Role dan Menu
        $roles = DB::table('Ms_roles')->get(); 
        $menus = DB::table('Ms_menus')->get();
        $now = Carbon::now();

        $this->command->info("Menanamkan hak akses untuk " . $roles->count() . " role...");

        foreach ($roles as $role) {
            foreach ($menus as $menu) {
                
                // Identifikasi Menu Sensitif (Hanya Admin/Super Admin yang boleh sentuh ini)
                $isSettingMenu = in_array($menu->code, ['SET_PARENT', 'SET_USER', 'SET_ROLE', 'SET_APP', 'SET_TENANT']);
                // Identifikasi Menu Laporan (Owner & Admin)
                $isReportMenu = str_contains($menu->code, 'REP_') || str_contains($menu->code, 'LOG_');

                // Default Permission (Kosong/False)
                $permission = [
                    'can_view'   => false,
                    'can_create' => false,
                    'can_update' => false,
                    'can_delete' => false,
                    'can_export' => false,
                ];

                // --- LOGIKA HAK AKSES BERDASARKAN CODE ROLE ---

                if ($role->code === 'SUPER_ADMIN') {
                    // Dewa: Bisa segalanya di semua menu
                    $permission = [
                        'can_view'   => true, 'can_create' => true, 'can_update' => true,
                        'can_delete' => true, 'can_export' => true,
                    ];
                } 
                
                elseif ($role->code === 'ADMIN') {
                    // Administrator Tenant: Bisa operasional, tapi delete & export dibatasi di beberapa tempat
                    $permission = [
                        'can_view'   => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => !$isSettingMenu, // Gak boleh delete data master setting
                        'can_export' => true,
                    ];
                } 

                elseif ($role->code === 'OWNER') {
                    // Owner: Fokus monitoring (View & Export). Tidak untuk input harian.
                    $permission = [
                        'can_view'   => true,
                        'can_create' => false,
                        'can_update' => false,
                        'can_delete' => false,
                        'can_export' => true, // Owner wajib bisa tarik data
                    ];
                }

                elseif ($role->code === 'KASIR') {
                    // Kasir: Hanya operasional harian, dilarang masuk ke Setting atau Laporan sensitif
                    if (!$isSettingMenu && !$isReportMenu) {
                        $permission = [
                            'can_view'   => true,
                            'can_create' => true,
                            'can_update' => true,
                            'can_delete' => false,
                            'can_export' => false,
                        ];
                    }
                }

                // 2. Insert atau Update ke database
                DB::table('Ms_role_menu_permissions')->updateOrInsert(
                    [
                        'tenant_id' => $role->tenant_id, 
                        'role_id'   => $role->id,
                        'menu_id'   => $menu->id,
                    ],
                    [
                        'module_id'  => $menu->module_id,
                        'is_active'  => true,
                        'created_by' => 'SYSTEM_SEEDER',
                        'created_at' => $now,
                        'updated_at' => $now,
                        ...$permission,
                    ]
                );
            }
        }

        $this->command->info("🔥 Hak akses berhasil dikonfigurasi untuk seluruh Tenant!");
    }
}