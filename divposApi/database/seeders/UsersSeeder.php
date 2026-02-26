<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Ms_tenant as MsTenant;


class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $roles = DB::table('Ms_roles')->pluck('id', 'code');
        $tenants = MsTenant::whereIn('code', ['TEN-001', 'TEN-002'])->get()->keyBy('code');

        $data = [
            'TEN-001' => [
                [
                    'full_name' => 'Agus Solihin',
                    'email'     => 'sa@gokucek.com',
                    'username'  => 'superadmin',
                    'password'  => Hash::make('P@ssword1234'),
                    'phone'     => '628111111111',
                    'role_code' => 'SUPER_ADMIN',
                ],
                // ... user statis lainnya tetap di sini
            ],
            // ... TEN-002 tetap di sini
        ];

        // 1. Insert User Utama (Statis)
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
                        'tenant_id'         => $tenant->id,
                        'created_at'        => now(),
                        'updated_at'        => now(),
                    ]
                );
            }
        }

        // 2. Insert 10.000 Fake Users (Bulk Insert)
        $this->command->info("Membuat 10.000 fake users...");
        
        $totalFake = 10000;
        $batchSize = 1000;
        $defaultPassword = Hash::make('password'); // Satu kali hash saja untuk semua fake user

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
                    'role_id'           => $roles['KASIR'], // Beri role Kasir untuk semua fake user
                    'tenant_id'         => $tenants['TEN-001']->id,
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