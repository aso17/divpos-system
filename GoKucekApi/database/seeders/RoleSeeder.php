<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('Ms_roles')->insert([
            [
                'role_name' => 'Super Admin',
                'code' => 'SUPER_ADMIN',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'role_name' => 'Administrator',
                'code' => 'ADMIN',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'role_name' => 'User',
                'code' => 'USER',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
