<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Ms_tenant as MsTenant;
use Carbon\Carbon;

class UsersSeeder extends Seeder
{
   public function run(): void
{
    $roles = DB::table('Ms_roles')->pluck('id', 'code');

    $tenants = MsTenant::whereIn('code', ['TEN-001', 'TEN-002'])->get()->keyBy('code');

        $data = [
            'TEN-001' => [
                [
                    'full_name' => 'Agus Solihin',
                    'email'     => 'sa@gokucek.com',
                    'username'  => 'superadmin',
                    'password'  => Hash::make('P@ssword1234'),
                    'phone'     => '628111111111',
                    'role_code' => 'SUPER_ADMIN',
                ],
                [
                    'full_name' => 'Budi Santoso',
                    'email'     => 'admin@gokucek.com',
                    'username'  => 'admin',
                    'password'  => Hash::make('P@ssword1234'),
                    'phone'     => '628122222222',
                    'role_code' => 'ADMIN',
                ],
                [
                    'full_name' => 'Siti Aisyah',
                    'email'     => 'kasir@gokucek.com',
                    'username'  => 'kasir',
                    'password'  => Hash::make('P@ssword1234'),
                    'phone'     => '628133333333',
                    'role_code' => 'KASIR',
                ],
            ],

            'TEN-002' => [
                [
                    'full_name' => 'Andi Pratama',
                    'email'     => 'admin@bersihjaya.com',
                    'username'  => 'admin_bj',
                    'password'  => Hash::make('P@ssword1234'),
                    'phone'     => '628144444444',
                    'role_code' => 'ADMIN',
                ],
                [
                    'full_name' => 'Rina Kurnia',
                    'email'     => 'kasir@bersihjaya.com',
                    'username'  => 'kasir_bj',
                    'password'  => Hash::make('P@ssword1234'),
                    'phone'     => '628155555555',
                    'role_code' => 'KASIR',
                ],
            ],
        ];


    foreach ($data as $tenantCode => $users) {
        $tenant = $tenants[$tenantCode];

        foreach ($users as $user) {
            DB::table('Ms_users')->updateOrInsert(
                ['email' => $user['email']],
                [
                    'full_name'         => $user['full_name'],
                    'username'          => $user['username'],
                    'password'          => $user['password'],
                    'phone'             => $user['phone'],
                    'avatar'            => null,
                    'is_active'         => true,
                    'email_verified_at' => now(),
                    'last_login_at'     => null,
                    'last_login_ip'     => null,
                    'last_activity_at'  => null,
                    'role_id'           => $roles[$user['role_code']] ?? null,
                    'tenant_id'         => $tenant->id,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]
            );
        }
    }
}

}
