<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil Tenant & User yang sudah dibuat di seeder sebelumnya
        $tenantLdr = DB::table('Ms_tenants')->where('code', 'LDR-001')->first();
        $tenantSln = DB::table('Ms_tenants')->where('code', 'SLN-001')->first();

        $userSa = DB::table('Ms_users')->where('username', 'superadmin_ldr')->first();
        $userOwner = DB::table('Ms_users')->where('username', 'owner_sln')->first();

        if (!$tenantLdr || !$userSa) {
            $this->command->error("Data Tenant atau User belum ada. Jalankan UsersSeeder dulu!");
            return;
        }

        // 2. Data Employee Utama (Manual)
        $employees = [
            [
                'user_id'       => $userSa->id,
                'tenant_id'     => $tenantLdr->id,
                'outlet_id'     => null, // Super Admin biasanya Global
                'employee_code' => 'EMP-1-0001',
                'full_name'     => 'Agus Solihin',
                'phone'         => '628111111111',
                'job_title'     => 'CEO / Founder',
                'is_active'     => true,
            ],
            [
                'user_id'       => $userOwner->id,
                'tenant_id'     => $tenantSln->id,
                'outlet_id'     => null,
                'employee_code' => 'EMP-2-0001',
                'full_name'     => 'Owner Salon',
                'phone'         => '628222222222',
                'job_title'     => 'Owner',
                'is_active'     => true,
            ],
        ];

        foreach ($employees as $emp) {
            DB::table('Ms_employees')->updateOrInsert(
                ['user_id' => $emp['user_id']], 
                array_merge($emp, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 3. Generate Fake Employee untuk 10.000 User Fake tadi
        $this->command->info("Menghubungkan 10.000 fake users ke Ms_employees...");
        
        // Ambil ID users yang belum punya employee (kecuali yang utama tadi)
        $fakeUsers = DB::table('Ms_users')
            ->whereNotIn('id', [$userSa->id, $userOwner->id])
            ->pluck('id');

        $batchSize = 1000;
        $total = count($fakeUsers);

        foreach ($fakeUsers->chunk($batchSize) as $index => $chunk) {
            $dataBatch = [];
            foreach ($chunk as $idx => $userId) {
                $dataBatch[] = [
                    'user_id'       => $userId,
                    'tenant_id'     => $tenantLdr->id,
                    'outlet_id'     => null,
                    'employee_code' => 'EMP-' . $tenantLdr->id . '-' . str_pad(($index * $batchSize) + $idx + 2, 5, '0', STR_PAD_LEFT),
                    'full_name'     => fake()->name(),
                    'phone'         => fake()->phoneNumber(),
                    'job_title'     => 'Staff',
                    'is_active'     => true,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ];
            }
            DB::table('Ms_employees')->insert($dataBatch);
            $this->command->comment("Batch Employee " . ($index + 1) . " berhasil...");
        }

        $this->command->info("Selesai! Sekarang semua User sudah punya profil Employee.");
    }
}