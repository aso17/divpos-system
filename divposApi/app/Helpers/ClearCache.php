<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ClearCache
{
    /**
     * Membersihkan cache sidebar (nav_v2) untuk semua user dalam satu role.
     * Dipanggil saat update Permission Role.
     */
    public static function roleMenu(int $tenantId, int $roleId): void
    {
        $userIds = DB::table('Ms_users')
            ->where('tenant_id', $tenantId)
            ->where('role_id', $roleId)
            ->pluck('id');

        foreach ($userIds as $id) {
            Cache::forget("nav_v2_{$id}");
        }
    }

    /**
     * Membersihkan cache sidebar untuk satu user spesifik.
     */
    public static function userMenu(int $userId): void
    {
        Cache::forget("nav_v2_{$userId}");
    }

    /**
     * Membersihkan cache init data transaksi (Packages, Outlets, Payment Methods)
     */
    public static function tenantTransaction(int $tenantId): void
    {
        // 1. Hapus cache khusus milik Owner (Samakan dengan format v3)
        Cache::forget("init_data_v3_{$tenantId}_owner_global");

        // 2. Ambil semua ID outlet
        $outletIds = DB::table('Ms_outlets')
            ->where('tenant_id', $tenantId)
            ->pluck('id');

        // 3. Hapus cache tiap-tiap outlet (Samakan dengan format v3)
        foreach ($outletIds as $id) {
            Cache::forget("init_data_v3_{$tenantId}_outlet_{$id}");
        }
    }
}
