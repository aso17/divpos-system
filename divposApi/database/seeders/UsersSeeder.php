<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Persiapan Master Data
        $roles = DB::table('Ms_roles')->pluck('id', 'code');
        
        // 🔥 PERBAIKAN: Tambahkan 'name' agar bisa dipanggil di baris info command
        $tenants = DB::table('Ms_tenants')->select('id', 'code', 'slug', 'name')->get();

        if ($tenants->isEmpty()) {
            $this->command->error("Tenant tidak ditemukan! Jalankan TenantSeeder dulu.");
            return;
        }

        $passwordUtama = Hash::make('P@ssword1234');
        $passwordFake = Hash::make('P@ssword1234');
        $now = now();
        $kasirRoleId = $roles['KASIR'] ?? null;

        $this->command->info("Memasukkan user utama (Super Admin & Owners)...");

        // --- A. INSERT SUPER ADMIN (Tanpa Tenant) ---
        DB::table('Ms_users')->updateOrInsert(
            ['email' => 'sa@la.com'],
            [
                'username'          => 'superadmin_divpos',
                'password'          => $passwordUtama,
                'is_active'         => true,
                'email_verified_at' => $now,
                'role_id'           => $roles['SUPER_ADMIN'] ?? null,
                'tenant_id'         => null, 
                'created_at'        => $now,
                'updated_at'        => $now,
            ]
        );

        // --- B. INSERT OWNER PER TENANT ---
        foreach ($tenants as $tenant) {
            $emailOwner = "owner@" . $tenant->slug . ".test";
            
            DB::table('Ms_users')->updateOrInsert(
                ['email' => $emailOwner],
                [
                    'username'          => "owner_" . str_replace('-', '_', $tenant->slug),
                    'password'          => $passwordUtama,
                    'is_active'         => true,
                    'email_verified_at' => $now,
                    'role_id'           => $roles['OWNER'] ?? null,
                    'tenant_id'         => $tenant->id,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]
            );

            // Relasikan Owner ke Tabel Tenants
            $ownerId = DB::table('Ms_users')->where('email', $emailOwner)->value('id');
            DB::table('Ms_tenants')->where('id', $tenant->id)->update(['owner_id' => $ownerId]);
        }

        // 2. SEEDING MASSAL (100.000 DATA dibagi per Tenant)
        $totalUserTarget = 100000; 
        $userPerTenant = (int) ($totalUserTarget / $tenants->count());
        $batchSize = 2500; 

        $this->command->info("Memulai pembuatan total $totalUserTarget users (sekitar $userPerTenant per tenant)...");

        foreach ($tenants as $tenant) {
            $this->command->info("Menanam user untuk Tenant: {$tenant->name}...");

            for ($i = 0; $i < ($userPerTenant / $batchSize); $i++) {
                $fakeUsers = [];
                for ($j = 0; $j < $batchSize; $j++) {
                    // ID Unik agar email tidak duplikat
                    $idUnik = ($tenant->id * 1000000) + ($i * $batchSize) + $j; 
                    
                    $fakeUsers[] = [
                        'email'             => "kasir_{$idUnik}@{$tenant->slug}.test",
                        'username'          => "kasir_{$idUnik}_{$tenant->code}",
                        'password'          => $passwordFake,
                        'is_active'         => true,
                        'tenant_id'         => $tenant->id,
                        'email_verified_at' => $now,
                        'role_id'           => $kasirRoleId,
                        'created_at'        => $now,
                        'updated_at'        => $now,
                    ];
                }
                
                // Gunakan Transaksi per batch agar lebih cepat
                DB::transaction(function () use ($fakeUsers) {
                    DB::table('Ms_users')->insert($fakeUsers);
                });
            }
            $this->command->comment("Selesai untuk tenant {$tenant->code}.");
        }

        $this->command->info("🔥 BERHASIL! User tersebar di LAUNDRY, SALON, BARBERSHOP, CARWASH, & PETGROOMING.");
    }
}