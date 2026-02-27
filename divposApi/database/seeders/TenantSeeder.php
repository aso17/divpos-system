<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
       

        $tenants = [
            [
                'name' => 'Laundry Makmur',
                'business_type_id' => 1, // LAUNDRY
                'slug' => Str::slug('Laundry Makmur'),
                'code' => 'LDR-001',
                'domain' => 'laundrymakmur.test',
                'is_active' => true,
                'is_default' => true,
                'subscription_ends_at' => Carbon::now()->addYears(1),
                'created_at'    => now(),
            ],
            [
                'name' => 'Rambut Indah Salon',
                'business_type_id' => 2, // SALON
                'slug' => Str::slug('Rambut Indah Salon'),
                'code' => 'SLN-001',
                'domain' => 'rambutindah.test',
                'is_active' => true,
                'is_default' => false,
                'subscription_ends_at' => Carbon::now()->addMonths(6),
                'created_at'    => now(),
            ],
            [
                'name' => 'Pet Paw Grooming',
                'business_type_id' => 5, // PETGROOMING
                'slug' => Str::slug('Pet Paw Grooming'),
                'code' => 'PET-001',
                'domain' => 'petpaw.test',
                'is_active' => true,
                'is_default' => false,
                'subscription_ends_at' => Carbon::now()->addMonths(3),
                'created_at'    => now(),
            ],
        ];

        // Menggunakan DB table untuk menghindari isu namespace model saat migrasi
        DB::table('Ms_tenants')->insert($tenants);
    }
}