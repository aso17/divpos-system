<?php

// database/seeders/ModuleSeeder.php

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
                'icon'        => 'home',
                'order_no'    => 1,
            ],
            [
                'module_name' => 'Transaction', // UBAH
                'code'        => 'TRANSAKSI',
                'icon'        => 'credit-card', 
                'order_no'    => 2,
            ],
            [
                'module_name' => 'Master Data',
                'code'        => 'MASTER',
                'icon'        => 'grid', 
                'order_no'    => 3,
            ],
            [
                'module_name' => 'Report', // UBAH
                'code'        => 'REPORT',
                'icon'        => 'file-text', 
                'order_no'    => 4,
            ],
            [
                'module_name' => 'Setting', // UBAH
                'code'        => 'SETTING',
                'icon'        => 'settings', 
                'order_no'    => 5,
            ],
        ];

        foreach ($modules as $module) {
            DB::table('Ms_modules')->updateOrInsert(
                ['code' => $module['code']],
                [
                    'module_name' => $module['module_name'], // Tambahkan ini agar terupdate
                    'icon'        => $module['icon'],
                    'order_no'    => $module['order_no'],
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }
    }
}
