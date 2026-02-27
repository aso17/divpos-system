<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan tabel Ms_modules sudah diisi data
        $modules = DB::table('Ms_modules')->pluck('id', 'code');

        $menus = [
            // Dashboard
            ['module'=>'DASHBOARD','menu_name'=>'Dashboard','code'=>'DASH_HOME','route_name'=>'/dashboard','icon'=>'home','order_no'=>1,'parent'=>null],

            // TRANSAKSI
            ['module'=>'TRANSAKSI','menu_name'=>'Transaksi','code'=>'TRX_ORDER','route_name'=>'/transaction','icon'=>'credit-card','order_no'=>2,'parent'=>null],
            ['module'=>'TRANSAKSI','menu_name'=>'Riwayat Transaksi','code'=>'TRX_HISTORY','route_name'=>'/transaction-history','icon'=>'history','order_no'=>3,'parent'=>null],

            // MASTER DATA (PARENT)
            ['module'=>'MASTER','menu_name'=>'Master Data','code'=>'MST_PARENT','route_name'=>null,'icon'=>'database','order_no'=>4,'parent'=>null],

            ['module'=>'MASTER','menu_name'=>'Outlet / Cabang','code'=>'MST_OUTLET','route_name'=>'/outlets','icon'=>'map-pin','order_no'=>1,'parent'=>'MST_PARENT'],
            ['module'=>'MASTER','menu_name'=>'Pelanggan','code'=>'MST_PELANGGAN','route_name'=>'/customers','icon'=>'users','order_no'=>2,'parent'=>'MST_PARENT'],
            ['module'=>'MASTER','menu_name'=>'Karyawan','code'=>'MST_USER','route_name'=>'/employees','icon'=>'user-check','order_no'=>3,'parent'=>'MST_PARENT'],

            // Kelompok Pengaturan Produk
            ['module'=>'MASTER','menu_name'=>'Master Layanan','code'=>'MST_LAYANAN','route_name'=>'/services','icon'=>'layers','order_no'=>4,'parent'=>'MST_PARENT'],
            ['module'=>'MASTER','menu_name'=>'Kategori Jasa','code'=>'MST_KATEGORI','route_name'=>'/categories','icon'=>'clock','order_no'=>5,'parent'=>'MST_PARENT'],
            ['module'=>'MASTER','menu_name'=>'Paket Layanan','code'=>'MST_PAKET','route_name'=>'/packages','icon'=>'tag','order_no'=>6,'parent'=>'MST_PARENT'],

            // Kelompok Keuangan
            ['module'=>'MASTER','menu_name'=>'Metode Pembayaran','code'=>'MST_PAYMENT','route_name'=>'/payment-methods','icon'=>'credit-card','order_no'=>7,'parent'=>'MST_PARENT'],
          
            // LAPORAN
            ['module'=>'REPORT','menu_name'=>'Laporan','code'=>'RPT_PARENT','route_name'=>null,'icon'=>'bar-chart-2','order_no'=>5,'parent'=>null],
            ['module'=>'REPORT','menu_name'=>'Harian','code'=>'RPT_DAILY','route_name'=>'/reports/daily','icon'=>'calendar','order_no'=>1,'parent'=>'RPT_PARENT'],
            ['module'=>'REPORT','menu_name'=>'Bulanan','code'=>'RPT_MONTHLY','route_name'=>'/reports/monthly','icon'=>'calendar','order_no'=>2,'parent'=>'RPT_PARENT'],

           // SETTING
            ['module'=>'SETTING','menu_name'=>'Pengaturan','code'=>'SET_PARENT','route_name'=>null,'icon'=>'settings','order_no'=>6,'parent'=>null],
            ['module'=>'SETTING','menu_name'=>'Manajemen User','code'=>'SET_USER','route_name'=>'/users','icon'=>'users','order_no'=>1,'parent'=>'SET_PARENT'],
            ['module'=>'SETTING','menu_name'=>'Role & Permission','code'=>'SET_ROLE','route_name'=>'/roles','icon'=>'shield','order_no'=>2,'parent'=>'SET_PARENT'],
            ['module'=>'SETTING','menu_name'=>'Aplikasi','code'=>'SET_APP','route_name'=>'/settings/app','icon'=>'sliders','order_no'=>3,'parent'=>'SET_PARENT'],
        ];

        $menuMap = [];

        foreach ($menus as $menu) {
            $parentId = null;

            if ($menu['parent']) {
                $parentId = $menuMap[$menu['parent']] ?? null;
            }

            // Gunakan updateOrInsert agar tidak duplikat saat seeder dijalankan ulang
            DB::table('Ms_menus')->updateOrInsert(
                ['code' => $menu['code']],
                [
                    'module_id'  => $modules[$menu['module']] ?? null,
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

            // Simpan ID untuk relasi parent
            $menuMap[$menu['code']] = DB::table('Ms_menus')->where('code', $menu['code'])->value('id');
        }
    }
}