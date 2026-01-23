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
        // Ambil role map: ['SUPER_ADMIN' => 1, 'ADMIN' => 2, ...]
        $roles = DB::table('Ms_roles')->pluck('id', 'code');

        // Ambil tenant default (Gokucek)
        $tenant = MsTenant::where('code', 'TEN-001')->firstOrFail();

        $users = [
            [
                'full_name' => 'Super Administrator',
                'email'     => 'superadmin@gokucek.com',
                'username'  => 'superadmin',
                'password'  => Hash::make('P@ssword1234'),
                'phone'     => '628111111111',
                'role_code' => 'SUPER_ADMIN',
            ],
            [
                'full_name' => 'Administrator GoKucek',
                'email'     => 'admin@gokucek.com',
                'username'  => 'admin',
                'password'  => Hash::make('P@ssword1234'),
                'phone'     => '628122222222',
                'role_code' => 'ADMIN',
            ],
            [
                'full_name' => 'Kasir Laundry',
                'email'     => 'kasir@gokucek.com',
                'username'  => 'kasir',
                'password'  => Hash::make('P@ssword1234'),
                'phone'     => '628133333333',
                'role_code' => 'KASIR',
            ],
        ];

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
                    'status'            => 'active',
                    'email_verified_at' => now(),
                    'last_login_at'     => null,
                    'last_login_ip'     => null,
                    'last_activity_at'  => null,
                    'role_id'           => $roles[$user['role_code']] ?? null,
                    'tenant_id'         => $tenant->id, // 🔥 WAJIB ADA
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]
            );
        }
    }
}
