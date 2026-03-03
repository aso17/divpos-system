<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil data master role
        $roles = DB::table('Ms_roles')->pluck('id', 'code');

        // 2. Data User Utama (Hanya kolom yang ada di Ms_users)
        $users = [
            [
                'email'     => 'sa@lau.com',
                'username'  => 'superadmin_ldr',
                'password'  => Hash::make('P@ssword1234'),
                'role_code' => 'SUPER_ADMIN',
            ],
            [
                'email'     => 'owner@salon.test',
                'username'  => 'owner_sln',
                'password'  => Hash::make('P@ssword1234'),
                'role_code' => 'OWNER',
            ],
        ];

        $this->command->info("Memasukkan user utama...");
        foreach ($users as $user) {
            DB::table('Ms_users')->updateOrInsert(
                ['email' => $user['email']],
                [
                    'username'          => $user['username'],
                    'password'          => $user['password'],
                    'is_active'         => true,
                    'email_verified_at' => now(),
                    'role_id'           => $roles[$user['role_code']] ?? null,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]
            );
        }

        // 3. Insert 10.000 Fake Users (Optimized)
        $this->command->info("Membuat 10.000 fake users...");
        
        $totalFake = 100000;
        $batchSize = 1000;
        $defaultPassword = Hash::make('password'); 
        $kasirRoleId = $roles['KASIR'] ?? null;

        for ($i = 0; $i < ($totalFake / $batchSize); $i++) {
            $fakeUsers = [];
            for ($j = 0; $j < $batchSize; $j++) {
                $fakeUsers[] = [
                    'email'             => fake()->unique()->safeEmail(),
                    'username'          => fake()->unique()->userName(),
                    'password'          => $defaultPassword,
                    'is_active'         => true,
                    'email_verified_at' => now(),
                    'role_id'           => $kasirRoleId,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ];
            }
            DB::table('Ms_users')->insert($fakeUsers);
            $this->command->comment("Batch " . ($i + 1) . " (1.000 data) berhasil...");
        }

        $this->command->info("Selesai! Ms_users sekarang sudah penuh.");
    }
}