<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AppSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = DB::table('Ms_tenants')->get();

        foreach ($tenants as $tenant) {
            $businessType = DB::table('Ms_business_types')
                ->where('id', $tenant->business_type_id)
                ->value('code');

            // 1. Setting DP: Hanya muncul di Salon, Barber, Pet
            $enableDp = in_array($businessType, ['SLN', 'BRB', 'PET']) ? 'true' : 'false';

            // 2. Setting Bayar Nol: Hanya boleh di Laundry & Carwash
            $allowZeroPay = in_array($businessType, ['LDR', 'CRW']) ? 'true' : 'false';

            $settings = [
                [
                    'tenant_id'   => $tenant->id,
                    'key'         => 'trx_enable_dp',
                    'value'       => $enableDp,
                    'type'        => 'boolean',
                    'description' => 'Jika true, munculkan input DP. Jika false, input DP disembunyikan.',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ],
                [
                    'tenant_id'   => $tenant->id,
                    'key'         => 'trx_allow_zero_payment',
                    'value'       => $allowZeroPay,
                    'type'        => 'boolean',
                    'description' => 'Jika true, transaksi boleh disimpan meski nominal bayar nol (hutang).',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            ];

            foreach ($settings as $setting) {
                DB::table('App_settings')->updateOrInsert(
                    ['tenant_id' => $tenant->id, 'key' => $setting['key']],
                    $setting
                );
            }
        }

        $this->command->info("Konfigurasi Berhasil!");
        $this->command->info("- Laundry/Carwash: Input DP (Sembunyi), Bayar 0 (Boleh).");
        $this->command->info("- Salon/Barber/Pet: Input DP (Muncul), Bayar 0 (Dilarang).");
    }
}