<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $modules = DB::table('Ms_modules')->pluck('id', 'code');

        $menus = [
            // Dashboard
            ['module'=>'DASHBOARD','menu_name'=>'Dashboard','code'=>'DASH_HOME','route_name'=>'/dashboard','icon'=>'home','order_no'=>1,'parent'=>null],

            // 🔥 TRANSAKSI (TANPA PARENT)
            ['module'=>'TRANSAKSI','menu_name'=>'Transaksi','code'=>'TRX_ORDER','route_name'=>'/transaksi','icon'=>'credit-card','order_no'=>2,'parent'=>null],
            ['module'=>'TRANSAKSI','menu_name'=>'Riwayat Transaksi','code'=>'TRX_HISTORY','route_name'=>'/trxriwayat','icon'=>'history','order_no'=>3,'parent'=>null],

            // MASTER DATA (PARENT)
            ['module'=>'MASTER','menu_name'=>'Master Data','code'=>'MST_PARENT','route_name'=>null,'icon'=>'database','order_no'=>4,'parent'=>null],
            ['module'=>'MASTER','menu_name'=>'Pelanggan','code'=>'MST_PELANGGAN','route_name'=>'/master/pelanggan','icon'=>'users','order_no'=>1,'parent'=>'MST_PARENT'],
            ['module'=>'MASTER','menu_name'=>'Layanan','code'=>'MST_LAYANAN','route_name'=>'/master/layanan','icon'=>'package','order_no'=>2,'parent'=>'MST_PARENT'],
            ['module'=>'MASTER','menu_name'=>'Paket / Harga','code'=>'MST_PAKET','route_name'=>'/master/paket','icon'=>'tag','order_no'=>3,'parent'=>'MST_PARENT'],

            // LAPORAN
            ['module'=>'REPORT','menu_name'=>'Laporan','code'=>'RPT_PARENT','route_name'=>null,'icon'=>'bar-chart-2','order_no'=>5,'parent'=>null],
            ['module'=>'REPORT','menu_name'=>'Harian','code'=>'RPT_DAILY','route_name'=>'/laporan/harian','icon'=>'calendar','order_no'=>1,'parent'=>'RPT_PARENT'],
            ['module'=>'REPORT','menu_name'=>'Bulanan','code'=>'RPT_MONTHLY','route_name'=>'/laporan/bulanan','icon'=>'calendar','order_no'=>2,'parent'=>'RPT_PARENT'],

            // SETTING
            ['module'=>'SETTING','menu_name'=>'Pengaturan','code'=>'SET_PARENT','route_name'=>null,'icon'=>'settings','order_no'=>6,'parent'=>null],
            ['module'=>'SETTING','menu_name'=>'User & Role','code'=>'SET_USER_ROLE','route_name'=>'/setting/user-role','icon'=>'shield','order_no'=>1,'parent'=>'SET_PARENT'],
            ['module'=>'SETTING','menu_name'=>'Aplikasi','code'=>'SET_APP','route_name'=>'/setting/app','icon'=>'sliders','order_no'=>2,'parent'=>'SET_PARENT'],
        ];

        $menuMap = [];

        foreach ($menus as $menu) {
            $parentId = null;

            if ($menu['parent']) {
                $parentId = $menuMap[$menu['parent']] ?? null;
            }

            $id = DB::table('Ms_menus')->updateOrInsert(
                ['code' => $menu['code']],
                [
                    'module_id'  => $modules[$menu['module']],
                    'parent_id'  => $parentId,
                    'menu_name'  => $menu['menu_name'],
                    'route_name' => $menu['route_name'],
                    'icon'       => $menu['icon'],
                    'order_no'   => $menu['order_no'],
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $menuMap[$menu['code']] = DB::table('Ms_menus')->where('code', $menu['code'])->value('id');
        }
    }
}
