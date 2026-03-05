<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleMenuPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = DB::table('Ms_roles')->get(); 
        $menus = DB::table('Ms_menus')->get();
        $now = Carbon::now();

        foreach ($roles as $role) {
            foreach ($menus as $menu) {
                
                // --- KATEGORISASI MENU BERDASARKAN CODE DI MENUSEEDER ---
                $isDashboard = str_contains($menu->code, 'DASH_');
                $isTransaction = str_contains($menu->code, 'TRX_');
                $isMasterData = str_contains($menu->code, 'MST_');
                $isReport = str_contains($menu->code, 'RPT_');
                $isSetting = str_contains($menu->code, 'SET_');

                // Default: Akses Tertutup
                $permission = [
                    'can_view'   => false, 'can_create' => false, 'can_update' => false,
                    'can_delete' => false, 'can_export' => false,
                ];

                // --- LOGIKA HAK AKSES ---

                // 1. OWNER & SUPER_ADMIN: Raja di Tenant-nya (FULL ACCESS)
                if (in_array($role->code, ['OWNER', 'SUPER_ADMIN'])) {
                    $permission = [
                        'can_view'   => true, 'can_create' => true, 'can_update' => true,
                        'can_delete' => true, 'can_export' => true,
                    ];
                } 

                // 2. ADMIN: Operasional Full + Report, tapi Delete di Master/Setting dibatasi
                elseif ($role->code === 'ADMIN') {
                    $permission = [
                        'can_view'   => true,
                        'can_create' => true,
                        'can_update' => true,
                        'can_delete' => (!$isSetting && !$isMasterData), // Gak boleh sembarang hapus master/setting
                        'can_export' => true,
                    ];
                }

                // 3. KASIR: Hanya Transaksi & Master Pelanggan saja
                elseif ($role->code === 'KASIR') {
                    // Kasir boleh Dashboard, Transaksi, dan Master Data (Pelanggan/Layanan)
                    // Tapi Kasir HARAM masuk ke Report dan Setting
                    if ($isDashboard || $isTransaction || ($isMasterData && $menu->code !== 'MST_OUTLET')) {
                        $permission = [
                            'can_view'   => true,
                            'can_create' => true,
                            'can_update' => true,
                            'can_delete' => false, // No Delete for Kasir
                            'can_export' => false,
                        ];
                    }
                }

                // Simpan/Update Izin Akses
                DB::table('Ms_role_menu_permissions')->updateOrInsert(
                    [
                        'tenant_id' => $role->tenant_id, 
                        'role_id'   => $role->id,
                        'menu_id'   => $menu->id,
                    ],
                    array_merge($permission, [
                        'module_id'  => $menu->module_id,
                        'is_active'  => true,
                        'created_by' => 'SYSTEM_AUTO',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])
                );
            }
        }

        $this->command->info("🔥 Hak Akses Mas A_so sudah siap pakai!");
    }
}