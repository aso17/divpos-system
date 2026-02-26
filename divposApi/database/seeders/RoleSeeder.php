<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil ID dari tenant-tenant yang sudah ada
        $tenants = DB::table('Ms_tenants')->get();

        $roleDefaults = [
            [
                'role_name'   => 'Super Admin',
                'code'        => 'SUPER_ADMIN',
                'description' => 'Akses penuh ke seluruh modul dan pengaturan sistem.',
            ],
            [
                'role_name'   => 'Administrator',
                'code'        => 'ADMIN',
                'description' => 'Manajemen operasional harian dan data master.',
            ],
            [
                'role_name'   => 'Kasir',
                'code'        => 'KASIR',
                'description' => 'Akses terbatas untuk transaksi penjualan.',
            ],
            [
                'role_name'   => 'Owner',
                'code'        => 'OWNER',
                'description' => 'Akses monitoring laporan dan performa bisnis.',
            ],
        ];

        foreach ($tenants as $tenant) {
            foreach ($roleDefaults as $role) {
                // 2. Gunakan kombinasi tenant_id dan code sebagai kunci unik
                DB::table('Ms_roles')->updateOrInsert(
                    [
                        'tenant_id' => $tenant->id, 
                        'code'      => $role['code']
                    ], 
                    [
                        'role_name'   => $role['role_name'],
                        'description' => $role['description'],
                        'is_active'   => true,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]
                );
            }
        }
    }
}