<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ms_tenant as MSTenant; 
use Illuminate\Support\Carbon;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = [
            [
                'name'          => 'Gokucek',
                'slug'          => 'gokucek',
                'code'          => 'TEN-001',
                'domain'        => 'localhost',
                'email'         => 'admin@gokucek.test',
                'phone'         => '02112345678',
                'address'       => 'Jakarta, Indonesia',
                'logo_path'     => '/projects/logo.png',
                'primary_color' => '#2563EB',
                'theme'         => 'light',
                'is_active'     => true,
                'is_default'    => true,
                'subscription_ends_at' => Carbon::now()->addYears(10),
                'created_by'    => 'SYSTEM',
            ],
            [
                'name'          => 'Finexa',
                'slug'          => 'finexa',
                'code'          => 'TEN-002',
                'domain'        => 'finance.test',
                'email'         => 'fin@fx.test',
                'phone'         => '08123456789',
                'address'       => 'Sudirman Central Business District',
                'logo_path'     => '/projects/logov3.png',
                'primary_color' => '#16A34A',
                'theme'         => 'light',
                'is_active'     => true,
                'is_default'    => false,
                'subscription_ends_at' => Carbon::now()->addMonths(6),
                'created_by'    => 'SYSTEM',
            ],
            [
                'name'          => 'Hiraku',
                'slug'          => 'hiraku',
                'code'          => 'TEN-003',
                'domain'        => 'hris.test',
                'email'         => 'hr@hk.test',
                'phone'         => '08998877665',
                'address'       => 'Bandung Techno Park',
                'logo_path'     => '/logos/hris.png',
                'primary_color' => '#DC2626',
                'theme'         => 'light',
                'is_active'     => true,
                'is_default'    => false,
                'subscription_ends_at' => Carbon::now()->addMonths(1),
                'created_by'    => 'SYSTEM',
            ],
            [
                'name'          => 'Invora',
                'slug'          => 'invora',
                'code'          => 'TEN-004',
                'domain'        => 'inventory.test',
                'email'         => 'in@iv.test',
                'phone'         => '08112233445',
                'address'       => 'Kawasan Industri Jababeka',
                'logo_path'     => '/logos/inventory.png',
                'primary_color' => '#7C3AED',
                'theme'         => 'dark',
                'is_active'     => true,
                'is_default'    => false,
                'subscription_ends_at' => Carbon::now()->addDays(14), 
                'created_by'    => 'SYSTEM',
            ],
            [
                'name'          => 'Crimvo',
                'slug'          => 'crimvo',
                'code'          => 'TEN-005',
                'domain'        => 'crm.test',
                'email'         => 'hi@cv.test',
                'phone'         => '08556677889',
                'address'       => null,
                'logo_path'     => '/logos/crm.png',
                'primary_color' => '#0EA5E9',
                'theme'         => 'light',
                'is_active'     => false, 
                'is_default'    => false,
                'subscription_ends_at' => Carbon::now()->subDays(1),
                'created_by'    => 'SYSTEM',
            ],
        ];

        foreach ($tenants as $data) {
            MSTenant::updateOrCreate(['code' => $data['code']], $data);
        }
    }
}
