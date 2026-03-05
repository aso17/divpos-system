<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BusinessTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'name' => 'LAUNDRY', 
                'code' => 'LDR', 
                'description' => 'Layanan cuci satuan, kiloan, dan dry cleaning.'
            ],
            [
                'name' => 'SALON', 
                'code' => 'SLN', 
                'description' => 'Layanan kecantikan rambut, wajah, dan tubuh.'
            ],
            [
                'name' => 'BARBERSHOP', 
                'code' => 'BRB', 
                'description' => 'Layanan potong rambut dan grooming pria.'
            ],
            [
                'name' => 'CARWASH', 
                'code' => 'CRW', 
                'description' => 'Layanan cuci kendaraan mobil dan motor.'
            ],
            [
                'name' => 'PETGROOMING', 
                'code' => 'PET', 
                'description' => 'Layanan kebersihan dan perawatan hewan peliharaan.'
            ],
        ];

        $this->command->info("Menanamkan data Master Business Types...");

        foreach ($types as $type) {
            DB::table('Ms_business_types')->updateOrInsert(
                ['code' => $type['code']], // Cek berdasarkan kode unik
                [
                    'name'        => $type['name'],
                    'slug'        => Str::slug($type['name']), // Otomatis jadi 'laundry', 'salon', dll
                    'description' => $type['description'],
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }

        $this->command->info("Selesai! Master Bisnis siap digunakan.");
    }
}