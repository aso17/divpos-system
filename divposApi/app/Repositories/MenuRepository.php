<?php
namespace App\Repositories;

use Illuminate\Support\Facades\DB;

class MenuRepository
{
    /**
     * Jalur Staff: Berdasarkan mapping role & tenant khusus.
     * Mengutamakan keamanan data antar tenant.
     */
    public static function getByRole(int $roleId, int $tenantId)
    {
        return DB::table('Ms_role_menu_permissions as rp')
            ->join('Ms_menus as m', 'm.id', '=', 'rp.menu_id')
            ->join('Ms_modules as mo', 'mo.id', '=', 'm.module_id')
            ->where('rp.role_id', $roleId)
            ->where('rp.tenant_id', $tenantId) // Filter Tenant wajib ada
            ->where('rp.is_active', true)
            ->where('m.is_active', true)
            ->select([
                'mo.code as module_code',
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
            ->orderBy('mo.order_no')
            ->orderBy('m.order_no')
            ->get();
    }

    public static function getByBusinessType(string $businessTypeCode)
    {
        return DB::table('Ms_menus as m')
            ->join('Ms_modules as mo', 'mo.id', '=', 'm.module_id')
            ->whereIn('mo.code', [$businessTypeCode, 'COMMON'])
            ->where('m.is_active', true)
            ->where('mo.is_active', true)
            ->select([
                'mo.code as module_code',
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