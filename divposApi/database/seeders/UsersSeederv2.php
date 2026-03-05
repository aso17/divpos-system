<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeederv2 extends Seeder
{
    public function run(): void
    {
       
        $superAdminRole = DB::table('Ms_roles')
            ->where('code', 'SUPER_ADMIN')
            ->whereNull('tenant_id')
            ->first();

        $tenants = DB::table('Ms_tenants')->get();

        if ($tenants->isEmpty()) {
            $this->command->error("Tenant tidak ditemukan! Jalankan TenantSeeder dulu.");
            return;
        }

        $password = Hash::make('P@ssword1234');
        $now = now();

        // --- MASUKKAN SUPER ADMIN ---
        $this->command->info("Memasukkan Super Admin...");
        DB::table('Ms_users')->updateOrInsert(
            ['email' => 'sa@la.com'],
            [
                'username'          => 'superadmin',
                'password'          => $password,
                'is_active'         => true,
                'role_id'           => $superAdminRole->id ?? null,
                'tenant_id'         => null, // SA tidak terikat tenant
                'email_verified_at' => $now,
                'created_at'        => $now,
                'updated_at'        => $now,
            ]
        );

        // --- MASUKKAN OWNER PER TENANT ---
        $this->command->info("Memasukkan Owner per Tenant...");
        foreach ($tenants as $tenant) {
            // 🎯 LOGIC PENTING: Cari Role OWNER yang khusus milik tenant ini
            $roleOwner = DB::table('Ms_roles')
                ->where('tenant_id', $tenant->id)
                ->where('code', 'OWNER')
                ->first();

            if (!$roleOwner) {
                $this->command->warn("Role OWNER untuk tenant {$tenant->name} tidak ditemukan. Dilewati...");
                continue;
            }

            $emailOwner = "owner@" . $tenant->slug . ".test";
            
            DB::table('Ms_users')->updateOrInsert(
                ['email' => $emailOwner],
                [
                    'username'          => "owner_" . str_replace('-', '_', $tenant->slug),
                    'password'          => $password,
                    'is_active'         => true,
                    'role_id'           => $roleOwner->id, // Role milik tenant ini
                    'tenant_id'         => $tenant->id,
                    'email_verified_at' => $now,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]
            );

            // Update owner_id di table tenants agar sinkron
            $user = DB::table('Ms_users')->where('email', $emailOwner)->first();
            DB::table('Ms_tenants')->where('id', $tenant->id)->update(['owner_id' => $user->id]);
        }
    }
}