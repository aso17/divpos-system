<?php
namespace App\Services;

use Illuminate\Support\Facades\Cache;
use App\Repositories\MenuRepository;
use Illuminate\Support\Facades\DB;

class MenuService
{
    public static function getMenuByUser($user)
    {
        $cacheKey = "nav_v2_{$user->id}";

        return Cache::remember($cacheKey, 3600, function () use ($user) {
            $rows = collect();

            // 1. Deteksi Admin/Owner
            $isAdministrator = DB::table('Ms_tenants')
                ->where('id', $user->tenant_id)
                ->where('owner_id', $user->id)
                ->exists();

            if ($isAdministrator) {
                $bizCode = DB::table('Ms_tenants as t')
                    ->join('Ms_business_types as bt', 'bt.id', '=', 't.business_type_id')
                    ->where('t.id', $user->tenant_id)
                    ->value('bt.code');
                
                if ($bizCode) {
                    $rows = MenuRepository::getByBusinessType($bizCode);
                }
            } 
            elseif (!empty($user->role_id) && !empty($user->tenant_id)) {
                $rows = MenuRepository::getByRole((int) $user->role_id, (int) $user->tenant_id);
            }

            if ($rows->isEmpty()) {
                return ['tree' => [], 'map' => []];
            }

            $menuMap = [];
            $permissions = [];

            foreach ($rows as $row) {
                // 🎯 DISAMAKAN DENGAN REACT (RequirePermission.jsx)
                $perms = [
                    'view'   => (bool)$row->can_view,
                    'create' => (bool)$row->can_create,
                    'update' => (bool)$row->can_update,
                    'delete' => (bool)$row->can_delete, // PERBAIKAN TYPO DI SINI
                    'export' => (bool)($row->can_export ?? false),
                ];

                $menuMap[$row->menu_id] = [
                    'id'        => $row->menu_id,
                    'name'     => $row->menu_name,
                    'icon'      => $row->icon,
                    'route'      => $row->route_name,
                    'parent_id' => $row->parent_id,
                    'order_no'  => $row->order_no,
                    'perms'     => $perms,
                    'children'  => []
                ];

                if ($row->route_name) {
                    $permissions[$row->route_name] = $perms;
                }
            }

            // Build Tree
            $tree = [];
            foreach ($menuMap as $id => &$node) {
                if ($node['parent_id'] && isset($menuMap[$node['parent_id']])) {
                    $menuMap[$node['parent_id']]['children'][] = &$node;
                } else {
                    $tree[] = &$node;
                }
            }

            return ['tree' => $tree, 'map' => $permissions];
        });
    }
}