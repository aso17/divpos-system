<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'module_name' => 'Dashboard',
                'code'        => 'DASHBOARD',
                'icon'        => 'home',        // ✅ ada
                'order_no'    => 1,
            ],
            [
                'module_name' => 'Transaksi',
                'code'        => 'TRANSAKSI',
                'icon'        => 'credit-card', 
                'order_no'    => 2,
            ],
            [
                'module_name' => 'Master Data',
                'code'        => 'MASTER',
                'icon'        => 'grid',        // 📦 / struktur data
                'order_no'    => 3,
            ],
            [
                'module_name' => 'Laporan',
                'code'        => 'REPORT',
                'icon'        => 'file-text',   // 📄 laporan
                'order_no'    => 4,
            ],
            [
                'module_name' => 'Pengaturan',
                'code'        => 'SETTING',
                'icon'        => 'settings',    // ⚙️
                'order_no'    => 5,
            ],
        ];

        foreach ($modules as $module) {
            DB::table('Ms_modules')->updateOrInsert(
                ['code' => $module['code']],
                [
                    ...$module,
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }
    }
}
