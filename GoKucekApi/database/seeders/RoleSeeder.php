<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'role_name' => 'Super Admin',
                'code'      => 'SUPER_ADMIN',
            ],
            [
                'role_name' => 'Administrator',
                'code'      => 'ADMIN',
            ],
            [
                'role_name' => 'Kasir',
                'code'      => 'KASIR',
            ],
            [
                'role_name' => 'Owner',
                'code'      => 'OWNER',
            ],
        ];

        foreach ($roles as $role) {
            DB::table('Ms_roles')->insert([
                ...$role,
                'is_active'   => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
