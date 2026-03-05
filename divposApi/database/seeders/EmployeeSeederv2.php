<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class EmployeeSeederv2 extends Seeder
{
    public function run(): void
    {
        $tenants = DB::table('Ms_tenants')->get();
        $faker = Faker::create('id_ID');
        $shortYear = date('y'); // Untuk employee_code (26)
        $fullYear = (int)date('Y'); // Untuk kolom year (2026) 🎯
        $now = now();

        foreach ($tenants as $tenant) {
            // Logic Security: Hanya ambil user yang BELUM ada di tabel Ms_employees
            $usersToProcess = DB::table('Ms_users')
                ->where('tenant_id', $tenant->id)
                ->whereNotExists(function ($query) {
                    $query->select(DB::raw(1))
                          ->from('Ms_employees')
                          ->whereRaw('"Ms_employees"."user_id" = "Ms_users"."id"');
                })
                ->get();

            if ($usersToProcess->isEmpty()) {
                $this->command->warn("Tenant {$tenant->name}: Semua user sudah terdaftar sebagai employee.");
                continue;
            }

            $dataBatch = [];
            $tenantPadded = str_pad($tenant->id, 3, '0', STR_PAD_LEFT);

            foreach ($usersToProcess as $index => $user) {
                // Generate Employee Code: YY + TenantID(3) + Sequence(5)
                $employeeCode = $shortYear . $tenantPadded . str_pad($index + 1, 5, '0', STR_PAD_LEFT);

                $dataBatch[] = [
                    'user_id'       => $user->id,
                    'tenant_id'     => $tenant->id,
                    'year'          => $fullYear, // 🔥 TAMBAHKAN INI AGAR TIDAK ERROR
                    'employee_code' => $employeeCode,
                    'full_name'     => strtoupper($user->username),
                    'phone'         => '0812' . $faker->numerify('########'),
                    'job_title'     => 'Owner', // Sesuaikan logic job title Mas
                    'is_active'     => true,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }

            // Insert menggunakan transaksi agar aman
            DB::transaction(function () use ($dataBatch) {
                DB::table('Ms_employees')->insert($dataBatch);
            });

            $this->command->info("Berhasil menanam " . count($dataBatch) . " employee untuk {$tenant->name}");
        }
    }
}