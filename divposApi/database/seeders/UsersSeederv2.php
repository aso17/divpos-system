<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeederv2 extends Seeder
{
    public function run(): void
    {
        $tenants = DB::table('Ms_tenants')->get();

        if ($tenants->isEmpty()) {
            $this->command->error("Tenant tidak ditemukan! Jalankan TenantSeeder dulu.");
            return;
        }

        $password = Hash::make('P@ssword1234');
        $now = now();

        $this->command->info("Memasukkan Administrator (Owner) per Tenant...");

        foreach ($tenants as $tenant) {
            // Kita buat email admin yang unik berdasarkan slug tenant
            $emailAdmin = "admin@" . $tenant->slug . ".com";
            
            // 1. Masukkan User Administrator (Tanpa Role ID)
            DB::table('Ms_users')->updateOrInsert(
                ['email' => $emailAdmin],
                [
                    'username'          => "admin_" . str_replace('-', '_', $tenant->slug),
                    'password'          => $password,
                    'is_active'         => true,
                    'role_id'           => null, // PURE: Administrator/Owner tidak pakai role_id
                    'tenant_id'         => $tenant->id,
                    'email_verified_at' => $now,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]
            );

            // 2. Ambil ID user yang baru dibuat/diupdate
            $user = DB::table('Ms_users')->where('email', $emailAdmin)->first();

            // 3. Update owner_id di table Ms_tenants agar sinkron sebagai administrator
            DB::table('Ms_tenants')->where('id', $tenant->id)->update([
                'owner_id' => $user->id
            ]);

            $this->command->line(" - Tenant: {$tenant->name} | Admin: {$emailAdmin}");
        }

        $this->command->info("Selesai! Semua tenant kini memiliki satu Administrator.");
    }
}