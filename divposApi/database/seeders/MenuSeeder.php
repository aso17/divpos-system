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
            // --- 1. DASHBOARD ---
            ['module' => 'DASHBOARD','menu_name' => 'Dashboard','code' => 'DASH_HOME','route_name' => '/dashboard','icon' => 'home','order_no' => 1,'parent' => null],

            // --- 2. TRANSAKSI ---
            // Menggunakan icon plus-circle untuk kesan "Tambah Order Baru" yang intuitif
            ['module' => 'TRANSAKSI','menu_name' => 'Transaksi Kasir','code' => 'TRX_ORDER','route_name' => '/transaction','icon' => 'plus-circle','order_no' => 1,'parent' => null],
            ['module' => 'TRANSAKSI','menu_name' => 'Riwayat Transaksi','code' => 'TRX_HISTORY','route_name' => '/transaction-history','icon' => 'history','order_no' => 2,'parent' => null],

            // --- 3. MASTER DATA (PARENT) ---
            ['module' => 'MASTER','menu_name' => 'Master Data','code' => 'MST_PARENT','route_name' => null,'icon' => 'database','order_no' => 1,'parent' => null],

            ['module' => 'MASTER','menu_name' => 'Outlet / Cabang','code' => 'MST_OUTLET','route_name' => '/outlets','icon' => 'map-pin','order_no' => 1,'parent' => 'MST_PARENT'],

            // REDESAIN: Penyatuan Master Layanan, Kategori, dan Paket menjadi satu "Katalog"
            ['module' => 'MASTER','menu_name' => 'Katalog Layanan','code' => 'MST_KATALOG','route_name' => '/catalog','icon' => 'layers','order_no' => 2,'parent' => 'MST_PARENT'],

            ['module' => 'MASTER','menu_name' => 'Data Pelanggan','code' => 'MST_PELANGGAN','route_name' => '/customers','icon' => 'users','order_no' => 3,'parent' => 'MST_PARENT'],
            ['module' => 'MASTER','menu_name' => 'Data Karyawan','code' => 'MST_USER','route_name' => '/employees','icon' => 'user-check','order_no' => 4,'parent' => 'MST_PARENT'],

            // --- 4. LAPORAN (PARENT) ---
            ['module' => 'REPORT','menu_name' => 'Laporan','code' => 'RPT_PARENT','route_name' => null,'icon' => 'bar-chart-2','order_no' => 1,'parent' => null],

            ['module' => 'REPORT','menu_name' => 'Analisa Pendapatan','code' => 'RPT_REVENUE','route_name' => '/reports/revenue','icon' => 'dollar-sign','order_no' => 1,'parent' => 'RPT_PARENT'],
            ['module' => 'REPORT','menu_name' => 'Rekap Pembayaran','code' => 'RPT_PAYMENT_RECAP','route_name' => '/reports/payments','icon' => 'credit-card','order_no' => 4,'parent' => 'RPT_PARENT'],
            ['module' => 'REPORT','menu_name' => 'Status Layanan','code' => 'RPT_SERVICE_STATUS','route_name' => '/reports/service-status','icon' => 'refresh-cw','order_no' => 2,'parent' => 'RPT_PARENT'],
            ['module' => 'REPORT','menu_name' => 'Produk Terlaris','code' => 'RPT_BEST_SELLER','route_name' => '/reports/best-seller','icon' => 'package','order_no' => 3,'parent' => 'RPT_PARENT'],
            ['module' => 'REPORT','menu_name' => 'Performa Karyawan','code' => 'RPT_STAFF_PERF','route_name' => '/reports/staff-performance','icon' => 'award','order_no' => 5,'parent' => 'RPT_PARENT'],

           // --- 5. PENGATURAN (PARENT) ---
            ['module' => 'SETTING','menu_name' => 'Pengaturan','code' => 'SET_PARENT','route_name' => null,'icon' => 'settings','order_no' => 1,'parent' => null],
            ['module' => 'SETTING','menu_name' => 'Manajemen User','code' => 'SET_USER','route_name' => '/users','icon' => 'users','order_no' => 1,'parent' => 'SET_PARENT'],
            ['module' => 'SETTING','menu_name' => 'Role & Permission','code' => 'SET_ROLE','route_name' => '/roles','icon' => 'shield','order_no' => 2,'parent' => 'SET_PARENT'],
            ['module' => 'SETTING','menu_name' => 'Aplikasi','code' => 'SET_APP','route_name' => '/settings/app','icon' => 'sliders','order_no' => 3,'parent' => 'SET_PARENT'],
        ];

        $menuMap = [];

        foreach ($menus as $menu) {
            $parentId = null;

            if ($menu['parent']) {
                $parentId = $menuMap[$menu['parent']] ?? null;
            }

            // Gunakan updateOrInsert agar data tetap sinkron jika seeder dijalankan ulang
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

            // Simpan ID untuk relasi parent sub-menu
            $menuMap[$menu['code']] = DB::table('Ms_menus')->where('code', $menu['code'])->value('id');
        }
    }
}
