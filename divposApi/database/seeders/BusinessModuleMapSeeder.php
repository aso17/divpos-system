<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BusinessModuleMapSeeder extends Seeder
{
    public function run(): void
    {
        
        $businessTypes = DB::table('Ms_business_types')->get();
        $modules = DB::table('Ms_modules')->get();
        $this->command->info("Memetakan modul ke setiap tipe bisnis...");

        foreach ($businessTypes as $type) {
            foreach ($modules as $module) {
                DB::table('Ms_business_module_maps')->updateOrInsert(
                    [
                        'business_type_id' => $type->id,
                        'module_id'        => $module->id,
                    ],
                    [
                        'is_active'  => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        $this->command->info("Mapping selesai! Semua bisnis kini memiliki akses ke semua modul.");
    }
}