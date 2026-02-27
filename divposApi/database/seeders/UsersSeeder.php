<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil data master untuk relasi (pastikan seeder Role dan Tenant sudah jalan)
        $roles = DB::table('Ms_roles')->pluck('id', 'code');
        $tenants = DB::table('Ms_tenants')->whereIn('code', ['LDR-001', 'SLN-001'])->get()->keyBy('code');

        // Pastikan tenant ada sebelum lanjut
        if ($tenants->isEmpty()) {
            $this->command->error("Tenant belum ada! Jalankan TenantSeeder dulu.");
            return;
        }

        // 2. Data User Utama (Statis)
        $data = [
            'LDR-001' => [ // Sesuai dengan code di TenantSeeder baru
                [
                    'full_name' => 'Agus Solihin',
                    'email'     => 'sa@laundrymakmur.test',
                    'username'  => 'superadmin_ldr',
                    'password'  => Hash::make('P@ssword1234'),
                    'phone'     => '628111111111',
                    'role_code' => 'SUPER_ADMIN',
                ],
            ],
            'SLN-001' => [
                [
                    'full_name' => 'Owner Salon',
                    'email'     => 'owner@salon.test',
                    'username'  => 'owner_sln',
                    'password'  => Hash::make('P@ssword1234'),
                    'phone'     => '628222222222',
                    'role_code' => 'OWNER',
                ],
            ],
        ];

        // 3. Insert User Utama (Statis)
        $this->command->info("Memasukkan user utama...");
        foreach ($data as $tenantCode => $users) {
            $tenant = $tenants[$tenantCode] ?? null;
            if (!$tenant) continue;

            foreach ($users as $user) {
                DB::table('Ms_users')->updateOrInsert(
                    ['email' => $user['email']],
                    [
                        'full_name'         => $user['full_name'],
                        'username'          => $user['username'],
                        'password'          => $user['password'],
                        'phone'             => $user['phone'],
                        'is_active'         => true,
                        'email_verified_at' => now(),
                        'role_id'           => $roles[$user['role_code']] ?? null,
                        'tenant_id'         => $tenant->id, // Relasi ke Tenant
                        'created_at'        => now(),
                        'updated_at'        => now(),
                    ]
                );
            }
        }

        // 4. Insert 10.000 Fake Users (Bulk Insert)
        $this->command->info("Membuat 10.000 fake users...");
        
        $totalFake = 10000;
        $batchSize = 1000;
        $defaultPassword = Hash::make('password'); 
        $kasirRoleId = $roles['KASIR'] ?? null;
        $tenantIdForFake = $tenants['LDR-001']->id ?? null;

        if (!$kasirRoleId || !$tenantIdForFake) {
            $this->command->error("Role KASIR atau Tenant LDR-001 tidak ditemukan.");
            return;
        }

        for ($i = 0; $i < ($totalFake / $batchSize); $i++) {
            $fakeUsers = [];
            for ($j = 0; $j < $batchSize; $j++) {
                $fakeUsers[] = [
                    'full_name'         => fake()->name(),
                    'email'             => fake()->unique()->safeEmail(),
                    'username'          => fake()->unique()->userName(),
                    'password'          => $defaultPassword,
                    'phone'             => fake()->phoneNumber(),
                    'is_active'         => true,
                    'email_verified_at' => now(),
                    'role_id'           => $kasirRoleId,
                    'tenant_id'         => $tenantIdForFake,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ];
            }
            DB::table('Ms_users')->insert($fakeUsers);
            $this->command->comment("Batch " . ($i + 1) . " (1.000 data) berhasil masuk...");
        }

        $this->command->info("Selesai! Total data user sekarang melimpah.");
    }
}