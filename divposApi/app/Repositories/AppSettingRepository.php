<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

class AppSettingRepository
{
    protected $table = 'App_settings';

    /**
     * Ambil semua setting berdasarkan tenant_id
     */
    public function getByTenant($tenantId)
    {
        return DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->get();
    }

    /**
     * Ambil satu nilai setting spesifik
     */
    public function getVal($tenantId, $key, $default = null)
    {
        $setting = DB::table($this->table)
            ->where('tenant_id', $tenantId)
            ->where('key', $key)
            ->first();

        return $setting ? $setting->value : $default;
    }
}