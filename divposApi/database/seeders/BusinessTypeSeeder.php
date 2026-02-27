<?php

// database/seeders/BusinessTypeSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BusinessTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            ['name' => 'LAUNDRY', 'code' => 'LDR'],
            ['name' => 'SALON', 'code' => 'SLN'],
            ['name' => 'BARBERSHOP', 'code' => 'BRB'],
            ['name' => 'CARWASH', 'code' => 'CRW'],
            ['name' => 'PETGROOMING', 'code' => 'PET'],
        ];

        DB::table('Ms_business_types')->insert($types);
    }
}