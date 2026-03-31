<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

class MenuRepository
{
    /**
     * Jalur Staff: Berdasarkan Role + Tenant (Isolasi Data)
     */
    public static function getByRole(int $roleId, int $tenantId)
    {
        return DB::table('Ms_role_menu_permissions as rp')
            ->join('Ms_menus as m', 'm.id', '=', 'rp.menu_id')
            ->leftJoin('Ms_modules as mo', 'mo.id', '=', 'm.module_id') // pakai LEFT biar aman
            ->where([
                ['rp.role_id', '=', $roleId],
                ['rp.tenant_id', '=', $tenantId],
                ['rp.is_active', '=', true],
                ['m.is_active', '=', true],
            ])
            ->select([
                'm.id as menu_id',
                'm.menu_name',
                'm.icon',
                'm.route_name',
                'm.parent_id',
                'm.order_no',
                'rp.can_view',
                'rp.can_create',
                'rp.can_update',
                'rp.can_delete',
                'rp.can_export'
            ])
            ->orderByRaw('COALESCE(mo.order_no, 0) ASC') // biar module null tidak error
            ->orderBy('m.order_no')
            ->get();
    }

    /**
     * Jalur Administrator (Owner): Berdasarkan Mapping Bisnis (VVIP Access)
     */
    public static function getByBusinessType(string $businessTypeCode)
    {
        return DB::table('Ms_menus as m')
            ->join('Ms_modules as mo', 'mo.id', '=', 'm.module_id')
            ->join('Ms_business_module_maps as bmm', 'bmm.module_id', '=', 'mo.id')
            ->join('Ms_business_types as bt', 'bt.id', '=', 'bmm.business_type_id')
            ->where([
                ['bt.code', '=', $businessTypeCode],
                ['bmm.is_active', '=', true],
                ['m.is_active', '=', true]
            ])
            // Note: Filter m.business_type_code dihapus karena kolom tidak ada di Ms_menus.
            // Filter sudah ter-handle secara otomatis lewat bmm (Business Module Map).
            ->select([
                'm.id as menu_id',
                'm.menu_name',
                'm.icon',
                'm.route_name',
                'm.parent_id',
                'm.order_no',
                DB::raw('1 as can_view'),
                DB::raw('1 as can_create'),
                DB::raw('1 as can_update'),
                DB::raw('1 as can_delete'),
                DB::raw('1 as can_export')
            ])
            ->orderBy('mo.order_no')
            ->orderBy('m.order_no')
            ->get();
    }
}
