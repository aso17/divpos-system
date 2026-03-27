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
            ModuleSeeder::class,
            MenuSeeder::class,
            SystemConfigurationSeeder::class,

            // TenantSeeder::class,
            // PaymentMethodSeeder::class,
            // RoleSeeder::class,
            // BusinessModuleMapSeeder::class,
            // RoleMenuPermissionSeeder::class,
            // UnitSeeder::class,
            // UsersSeederv2::class,
            //  EmployeeSeederv2::class,
        ]);

    }
}
