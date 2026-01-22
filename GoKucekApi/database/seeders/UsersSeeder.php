<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Ambil roles (key by code)
        $roles = DB::table('Ms_roles')
            ->whereIn('code', ['SUPER_ADMIN', 'ADMIN', 'USER'])
            ->pluck('id', 'code')
            ->toArray();

        // Ambil tenant default
        $defaultTenantId = DB::table('Ms_tenants')
            ->where('code', 'TEN-001')
            ->value('id');

        if (!$defaultTenantId) {
            throw new \Exception('Tenant default (code: TEN-001) belum ada. Jalankan TenantsSeeder dulu.');
        }

        $users = [
            [
                'full_name' => 'Super Admin',
                'username'  => 'superadmin',
                'email'     => 'sa@local.id',
                'role_code' => 'SUPER_ADMIN',
            ],
            [
                'full_name' => 'Administrator',
                'username'  => 'admin',
                'email'     => 'admin@local.id',
                'role_code' => 'ADMIN',
            ],
            [
                'full_name' => 'User',
                'username'  => 'user',
                'email'     => 'user@local.id',
                'role_code' => 'USER',
            ],
        ];

        $payload = collect($users)->map(function ($user) use ($roles, $defaultTenantId, $now) {
            return [
                'full_name'          => $user['full_name'],
                'username'           => $user['username'],
                'email'              => $user['email'],
                'password'           => Hash::make('P@ssw0rd123456'),

                // Status & security
                'is_active'          => true,
                'status'             => 'active',
                'email_verified_at'  => $now,
                'last_login_at'      => null,
                'last_login_ip'      => null,
                'last_activity_at'   => null,

                // Optional profile
                'phone'              => null,
                'avatar'             => null,

                // Relation
                'role_id'            => $roles[$user['role_code']] ?? null,
                'tenant_id'          => $defaultTenantId,

                // Audit
                'created_at'         => $now,
                'updated_at'         => $now,
            ];
        })->toArray();

        // Gunakan upsert agar tidak dobel saat seeding ulang
        DB::table('Ms_users')->upsert(
            $payload,
            ['email'], // unique key
            ['full_name','username','role_id','tenant_id','status','is_active','updated_at']
        );
    }
}
