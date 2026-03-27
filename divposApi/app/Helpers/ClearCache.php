<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ClearCache
{
    /**
     * Membersihkan cache init data transaksi (Packages, Outlets, Payment Methods)
     * Dipanggil setiap ada perubahan pada salah satu dari ketiga tabel tersebut.
     */
    public static function tenantTransaction(int $tenantId): void
    {
        // 1. Hapus cache khusus milik Owner (owner_global)
        Cache::forget("init_data_tenant_{$tenantId}_owner_global");

        // 2. Ambil semua ID outlet milik tenant ini
        // Kita tidak pakai filter 'is_active' di sini agar outlet yang baru saja
        // dinonaktifkan juga terhapus cache-nya (supaya tidak muncul di kasir).
        $outletIds = DB::table('Ms_outlets')
            ->where('tenant_id', $tenantId)
            ->pluck('id');

        // 3. Hapus cache tiap-tiap outlet (milik Kasir/Staff)
        foreach ($outletIds as $id) {
            Cache::forget("init_data_tenant_{$tenantId}_outlet_{$id}");
        }
    }
}
