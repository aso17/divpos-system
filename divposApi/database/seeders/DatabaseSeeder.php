<?php

namespace Database\Seeders;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
        public function run(): void
        {
            
            $this->call([
                BusinessTypeSeeder::class,
                TenantSeeder::class,
                // RoleSeeder::class,
                ModuleSeeder::class,
                MenuSeeder::class,
                BusinessModuleMapSeeder::class,
                // RoleMenuPermissionSeeder::class,
                UnitSeeder::class,
                SystemConfigurationSeeder::class,
                UsersSeederv2::class,
                 EmployeeSeederv2::class,
            ]);

        }
}
