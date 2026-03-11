<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UnitSeeder extends Seeder {
    public function run(): void {
        $units = [
            // LAUNDRY & PETGROOMING
            ['name' => 'Kilogram', 'short_name' => 'kg', 'is_decimal' => true],
            ['name' => 'Meter Persegi', 'short_name' => 'm2', 'is_decimal' => true],
            ['name' => 'Potong / Pcs', 'short_name' => 'pcs', 'is_decimal' => false],
            
            // SALON, BARBER, CARWASH
            ['name' => 'Orang / Sesi', 'short_name' => 'pax', 'is_decimal' => false],
            ['name' => 'Unit Kendaraan', 'short_name' => 'unit', 'is_decimal' => false],
            ['name' => 'Ekor', 'short_name' => 'tail', 'is_decimal' => false],
            
            // ADDITIONAL
            ['name' => 'Milliliter', 'short_name' => 'ml', 'is_decimal' => true],
            ['name' => 'Titik / Spot', 'short_name' => 'point', 'is_decimal' => false],
        ];

        foreach ($units as $unit) {
            DB::table('Ms_units')->insert(array_merge($unit, [
                'tenant_id' => null, // Set Global
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}