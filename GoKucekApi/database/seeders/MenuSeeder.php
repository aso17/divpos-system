<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $mainModuleId    = DB::table('Ms_modules')->where('code', 'MAIN')->value('id');
        $systemModuleId  = DB::table('Ms_modules')->where('code', 'SYSTEM')->value('id');

        /*
        |--------------------------------------------------------------------------
        | MAIN MENU (FLAT SAJA)
        |--------------------------------------------------------------------------
        */
        $flatMenus = [
            ['DASHBOARD', 'Dashboard', 'home', '/', 1],
            ['ROUTER', 'Router', 'server', '/servernas', 2],
            ['MITRA', 'Mitra', 'users', '/mitra', 3],
            ['OLT', 'OLT', 'grid', '/olt', 7],
            ['GENIE_ACS', 'GenieACS', 'settings-2', '/genieacs', 8],
            ['ODP', 'ODP', 'box', '/odp', 9],
            ['TIKET', 'Tiket', 'ticket', '/tiket', 10],
            ['TRANSAKSI', 'Transaksi', 'shuffle', '/transaksi', 12],
            ['WHATSAPP', 'WhatsApp', 'message-circle', '/whatsapp', 13],
        ];

        foreach ($flatMenus as $menu) {
            DB::table('Ms_menus')->insert([
                'module_id'  => $mainModuleId,
                'code'       => $menu[0],
                'menu_name'  => $menu[1],
                'icon'       => $menu[2],
                'route_name' => $menu[3],
                'parent_id'  => null,
                'order_no'   => $menu[4],
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | VOUCHER (PARENT + CHILD)
        |--------------------------------------------------------------------------
        */
        $voucherId = DB::table('Ms_menus')->insertGetId([
            'module_id'  => $mainModuleId,
            'code'       => 'VOUCHER',
            'menu_name'  => 'Voucher',
            'icon'       => 'wifi',
            'route_name' => null,
            'parent_id'  => null,
            'order_no'   => 4,
            'is_active'  => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $voucherChildren = [
            ['VOUCHER_PROFILE', 'Profile Voucher', '/voucher'],
            ['VOUCHER_STOCK', 'Stok Voucher', '/stock'],
            ['VOUCHER_SOLD', 'Voucher Terjual', '/sold'],
            ['VOUCHER_ONLINE', 'Voucher Online', 'online'],
            ['VOUCHER_RECAP', 'Rekap Voucher', '/recap'],
            ['VOUCHER_TEMPLATE', 'Template Manager', '/vouchertemplate'],
        ];

        foreach ($voucherChildren as $i => $child) {
            DB::table('Ms_menus')->insert([
                'module_id'  => $mainModuleId,
                'code'       => $child[0],
                'menu_name'  => $child[1],
                'icon'       => 'circle',
                'route_name' => $child[2],
                'parent_id'  => $voucherId,
                'order_no'   => $i + 1,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | LANGGANAN (PARENT + CHILD)
        |--------------------------------------------------------------------------
        */
        $langgananId = DB::table('Ms_menus')->insertGetId([
            'module_id'  => $mainModuleId,
            'code'       => 'LANGGANAN',
            'menu_name'  => 'Langganan',
            'icon'       => 'user-check',
            'route_name' => null,
            'parent_id'  => null,
            'order_no'   => 5,
            'is_active'  => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $langgananChildren = [
            ['PROFILE_PELANGGAN', 'Profile Pelanggan', '/langganan/profile'],
            ['DATA_PELANGGAN', 'Data Pelanggan', '/langganan/data'],
            ['STOP_BERLANGGAN', 'Stop Berlanggan', '/langganan/stop'],
            ['ONLINE_LANGGANAN', 'Langganan Online', '/langganan/online'],
        ];

        foreach ($langgananChildren as $i => $child) {
            DB::table('Ms_menus')->insert([
                'module_id'  => $mainModuleId,
                'code'       => $child[0],
                'menu_name'  => $child[1],
                'icon'       => 'circle',
                'route_name' => $child[2],
                'parent_id'  => $langgananId,
                'order_no'   => $i + 1,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | MAP (PARENT + CHILD)
        |--------------------------------------------------------------------------
        */
        $mapId = DB::table('Ms_menus')->insertGetId([
            'module_id'  => $mainModuleId,
            'code'       => 'MAP',
            'menu_name'  => 'Map',
            'icon'       => 'map-pin',
            'route_name' => null,
            'parent_id'  => null,
            'order_no'   => 6,
            'is_active'  => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $mapChildren = [
            ['MAP_PELANGGAN', 'Map pelanggan', '/map/pelanggan'],
            ['MAP_ODP', 'Map ODP', '/map/odp'],
        ];

        foreach ($mapChildren as $i => $child) {
            DB::table('Ms_menus')->insert([
                'module_id'  => $mainModuleId,
                'code'       => $child[0],
                'menu_name'  => $child[1],
                'icon'       => 'circle',
                'route_name' => $child[2],
                'parent_id'  => $mapId,
                'order_no'   => $i + 1,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | BILLING (PARENT + CHILD)
        |--------------------------------------------------------------------------
        */
        $billingId = DB::table('Ms_menus')->insertGetId([
            'module_id'  => $mainModuleId,
            'code'       => 'BILLING',
            'menu_name'  => 'Billing',
            'icon'       => 'credit-card',
            'route_name' => null,
            'parent_id'  => null,
            'order_no'   => 11,
            'is_active'  => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $billingChildren = [
            ['BILLING_INVOICE_UNPAID', 'Invoice unpaid', '/billing/invoice-unpaid'],
            ['BILLING_INVOICE_PAID', 'Invoice paid', '/billing/invoice-paid'],
            ['BILLING_TOPUP', 'TopUp saldo', '/billing/topup'],
            ['BILLING_MUTASI', 'Mutasi saldo', '/billing/mutasi'],
            ['BILLING_KUPON', 'Kupon diskon', '/billing/kupon'],
        ];

        foreach ($billingChildren as $i => $child) {
            DB::table('Ms_menus')->insert([
                'module_id'  => $mainModuleId,
                'code'       => $child[0],
                'menu_name'  => $child[1],
                'icon'       => 'circle',
                'route_name' => $child[2],
                'parent_id'  => $billingId,
                'order_no'   => $i + 1,
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | SYSTEM (BAGIAN BAWAH)
        |--------------------------------------------------------------------------
        */
        $systemMenus = [
            ['SETTING', 'Setting', 'settings', '/setting', 20],
            ['TOOLS', 'Tools', 'tool', '/tools', 21],
            ['ADMIN', 'Admin', 'user-cog', '/admin', 22],
            ['LOGS', 'Logs', 'info', '/logs', 23],
        ];

        foreach ($systemMenus as $menu) {
            DB::table('Ms_menus')->insert([
                'module_id'  => $systemModuleId,
                'code'       => $menu[0],
                'menu_name'  => $menu[1],
                'icon'       => $menu[2],
                'route_name' => $menu[3],
                'parent_id'  => null,
                'order_no'   => $menu[4],
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
