<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker; 

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil SEMUA Tenant yang terdaftar
        $tenants = DB::table('Ms_tenants')->get();

        if ($tenants->isEmpty()) {
            $this->command->error("Tidak ada Tenant ditemukan! Jalankan TenantSeeder dulu.");
            return;
        }

        $faker = Faker::create('id_ID');
        $batchSize = 2500; 
        $year = date('y');
        $now = now();

        foreach ($tenants as $tenant) {
            $this->command->info("--- Memproses Tenant: {$tenant->name} ({$tenant->code}) ---");

            // 2. Cari User yang milik tenant ini dan BELUM jadi employee
            $userIds = DB::table('Ms_users')
                ->where('tenant_id', $tenant->id)
                ->whereNotExists(function ($query) {
                    $query->select(DB::raw(1))
                          ->from('Ms_employees')
                          ->whereRaw('"Ms_employees"."user_id" = "Ms_users"."id"');
                })
                ->pluck('id');

            $total = count($userIds);
            if ($total === 0) {
                $this->command->warn("Semua user di tenant {$tenant->name} sudah jadi employee.");
                continue;
            }

            $this->command->info("Menghubungkan $total user ke Ms_employees untuk tenant ini...");
            $tenantIdPadded = str_pad($tenant->id, 3, '0', STR_PAD_LEFT);

            // 3. Proses Batching per Tenant
            foreach ($userIds->chunk($batchSize) as $chunkIndex => $chunk) {
                $dataBatch = [];
                foreach ($chunk as $idx => $userId) {
                    $sequence = ($chunkIndex * $batchSize) + $idx + 1;
                    $employeeCode = $year . $tenantIdPadded . str_pad($sequence, 6, '0', STR_PAD_LEFT);

                    $dataBatch[] = [
                        'user_id'       => $userId,
                        'tenant_id'     => $tenant->id,
                        'outlet_id'     => null,
                        'employee_code' => $employeeCode,
                        'full_name'     => $faker->name(),
                        'phone'         => '08' . $faker->numerify('##########'),
                        'job_title'     => 'Staff',
                        'is_active'     => true,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ];
                }

                DB::transaction(function () use ($dataBatch) {
                    DB::table('Ms_employees')->insert($dataBatch);
                });

                $progress = min(($chunkIndex + 1) * $batchSize, $total);
                $this->command->comment("Progress [{$tenant->code}]: $progress / $total...");
            }
        }

        $this->command->info("🔥 BERHASIL! Semua tenant sekarang punya data employee masing-masing.");
    }
}