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
                'name'          => 'Radius One ',
                'slug'          => 'radiusone',
                'code'          => 'TEN-001',
                'domain'        => 'localhost',
                'email'         => 'admin@radiusone.test',
                'phone'         => '02112345678',
                'address'       => 'Jakarta, Indonesia',
                'logo_path'     => '/projects/radiusone/logo.png',
                'primary_color' => '#2563EB',
                'theme'         => 'light',
                'is_active'     => true,
                'subscription_ends_at' => Carbon::now()->addYears(10), // Superadmin tidak terbatas
                'created_by'    => 'SYSTEM',
            ],
            [
                'name'          => 'Finance App Service',
                'slug'          => 'finance',
                'code'          => 'TEN-002',
                'domain'        => 'finance.test',
                'email'         => 'contact@finance.test',
                'phone'         => '08123456789',
                'address'       => 'Sudirman Central Business District',
                'logo_path'     => '/projects/radiusone/logo-finance.png',
                'primary_color' => '#16A34A',
                'theme'         => 'light',
                'is_active'     => true,
                'subscription_ends_at' => Carbon::now()->addMonths(6),
                'created_by'    => 'SYSTEM',
            ],
            [
                'name'          => 'HRIS Cloud System',
                'slug'          => 'hris',
                'code'          => 'TEN-003',
                'domain'        => 'hris.test',
                'email'         => 'hr@hris.test',
                'phone'         => '08998877665',
                'address'       => 'Bandung Techno Park',
                'logo_path'     => '/logos/hris.png',
                'primary_color' => '#DC2626',
                'theme'         => 'light',
                'is_active'     => true,
                'subscription_ends_at' => Carbon::now()->addMonths(1),
                'created_by'    => 'SYSTEM',
            ],
            [
                'name'          => 'Inventory Pro Solutions',
                'slug'          => 'inventory',
                'code'          => 'TEN-004',
                'domain'        => 'inventory.test',
                'email'         => 'support@inventory.test',
                'phone'         => '08112233445',
                'address'       => 'Kawasan Industri Jababeka',
                'logo_path'     => '/logos/inventory.png',
                'primary_color' => '#7C3AED',
                'theme'         => 'dark',
                'is_active'     => true,
                'subscription_ends_at' => Carbon::now()->addDays(14), // Masa Trial
                'created_by'    => 'SYSTEM',
            ],
            [
                'name'          => 'CRM Plus Enterprise',
                'slug'          => 'crm',
                'code'          => 'TEN-005',
                'domain'        => 'crm.test',
                'email'         => 'info@crmplus.test',
                'phone'         => '08556677889',
                'address'       => null,
                'logo_path'     => '/logos/crm.png',
                'primary_color' => '#0EA5E9',
                'theme'         => 'light',
                'is_active'     => false, // Dinonaktifkan
                'subscription_ends_at' => Carbon::now()->subDays(1), // Sudah Expired
                'created_by'    => 'SYSTEM',
            ],
        ];

        foreach ($tenants as $data) {
            // updateOrCreate mencegah duplikasi data jika seeder dijalankan ulang
            MsTenant::updateOrCreate(['code' => $data['code']], $data);
        }
    }
}