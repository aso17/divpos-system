<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        DB::table('Ms_modules')->insert([
            [
                'module_name' => 'Main',
                'code' => 'MAIN',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
          
            [
                'module_name' => 'System',
                'code' => 'SYSTEM',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
