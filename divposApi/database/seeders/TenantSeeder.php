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
        // Ambil ID Business Type dari database berdasarkan kodenya agar sinkron
        $laundryId    = DB::table('Ms_business_types')->where('code', 'LDR')->value('id');
        $salonId      = DB::table('Ms_business_types')->where('code', 'SLN')->value('id');
        $barberId     = DB::table('Ms_business_types')->where('code', 'BRB')->value('id');
        $carwashId    = DB::table('Ms_business_types')->where('code', 'CRW')->value('id');
        $petgroomingId = DB::table('Ms_business_types')->where('code', 'PET')->value('id');

        $tenants = [
            [
                'name' => 'Laundry Makmur',
                'business_type_id' => $laundryId,
                'slug' => Str::slug('Laundry Makmur'),
                'code' => 'LDR-001',
                'domain' => 'laundrymakmur.test',
                'is_active' => true,
                'is_default' => true,
                'subscription_ends_at' => Carbon::now()->addYears(1),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name' => 'Rambut Indah Salon',
                'business_type_id' => $salonId,
                'slug' => Str::slug('Rambut Indah Salon'),
                'code' => 'SLN-001',
                'domain' => 'rambutindah.test',
                'is_active' => true,
                'is_default' => false,
                'subscription_ends_at' => Carbon::now()->addMonths(6),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name' => 'Ganteng Maksimal Barbershop',
                'business_type_id' => $barberId,
                'slug' => Str::slug('Ganteng Maksimal Barbershop'),
                'code' => 'BRB-001',
                'domain' => 'gantengmaksimal.test',
                'is_active' => true,
                'is_default' => false,
                'subscription_ends_at' => Carbon::now()->addMonths(12),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name' => 'Kinclong Carwash',
                'business_type_id' => $carwashId,
                'slug' => Str::slug('Kinclong Carwash'),
                'code' => 'CRW-001',
                'domain' => 'kinclong.test',
                'is_active' => true,
                'is_default' => false,
                'subscription_ends_at' => Carbon::now()->addMonths(4),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name' => 'Pet Paw Grooming',
                'business_type_id' => $petgroomingId,
                'slug' => Str::slug('Pet Paw Grooming'),
                'code' => 'PET-001',
                'domain' => 'petpaw.test',
                'is_active' => true,
                'is_default' => false,
                'subscription_ends_at' => Carbon::now()->addMonths(3),
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
        ];

        foreach ($tenants as $tenant) {
            DB::table('Ms_tenants')->updateOrInsert(
                ['code' => $tenant['code']], 
                $tenant
            );
        }

        $this->command->info("Data Tenant (Laundry, Salon, Barbershop, Carwash, PetGrooming) berhasil ditanam!");
    }
}