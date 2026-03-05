<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use App\Repositories\MenuRepository;

class MenuService
{
    public static function getMenuByUser($user)
    {
        // Cache dibedakan per user karena menu Owner vs Staff berbeda
        $cacheKey = "user_menu_auth:{$user->id}";

        return Cache::remember($cacheKey, 3600, function () use ($user) {
            // 1. Ambil baris data (Jalur VVIP Owner atau Mapping Staff)
            $rows = $user->tenant_id 
                ? MenuRepository::getByBusinessType($user->business_type_code)
                : MenuRepository::getByRole($user->role_id,$user->tenant_id);

            $menus = [];
            $flatPermissions = [];

            // 2. Mapping data linear (O(n))
            foreach ($rows as $row) {
                $permissionData = [
                    'view'   => (bool) $row->can_view,
                    'create' => (bool) $row->can_create,
                    'update' => (bool) $row->can_update,
                    'delete' => (bool) $row->can_delete,
                ];

                $menus[$row->menu_id] = [
                    'id'          => $row->menu_id,
                    'name'        => $row->menu_name,
                    'icon'        => $row->icon,
                    'route'       => $row->route_name,
                    'parent_id'   => $row->parent_id,
                    'order_no'    => $row->order_no,
                    'permissions' => $permissionData,
                    'children'    => [],
                ];

                if ($row->route_name) {
                    $flatPermissions[$row->route_name] = $permissionData;
                }
            }

            // 3. Build Tree pakai Reference (Efisien & Cepat)
            $tree = [];
            foreach ($menus as $id => &$menu) {
                if ($menu['parent_id'] && isset($menus[$menu['parent_id']])) {
                    $menus[$menu['parent_id']]['children'][] = &$menu;
                } else {
                    $tree[] = &$menu;
                }
            }

            // 4. Sortir Level Utama
            usort($tree, fn($a, $b) => $a['order_no'] <=> $b['order_no']);

            return [
                'tree' => $tree,
                'map'  => $flatPermissions
            ];
        });
    }
}