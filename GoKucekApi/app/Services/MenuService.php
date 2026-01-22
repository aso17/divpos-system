<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use App\Repositories\MenuRepository;
class MenuService
{
    public static function getMenuByRole(int $roleId)
    {
        return Cache::remember("Menu_permission:role:{$roleId}", 3600, function () use ($roleId) {
            $rows = MenuRepository::getByRole($roleId);

            $menus = [];

            // 1️⃣ Mapping (SIMPAN order_no)
            foreach ($rows as $row) {
                $menus[$row->menu_id] = [
                    'id'        => $row->menu_id,
                    'name'      => $row->menu_name,
                    'icon'      => $row->icon,
                    'route'     => $row->route_name,
                    'parent_id' => $row->parent_id,
                    'order_no'  => $row->order_no,
                    'permissions' => [
                        'view'   => (bool) $row->can_view,
                        'create'=> (bool) $row->can_create,
                        'update'=> (bool) $row->can_update,
                        'delete'=> (bool) $row->can_delete,
                    ],
                    'children' => [],
                ];
            }

            $tree = [];

            // 2️⃣ Build tree
            foreach ($menus as $id => &$menu) {
                if ($menu['parent_id'] && isset($menus[$menu['parent_id']])) {
                    $menus[$menu['parent_id']]['children'][] = &$menu;
                } else {
                    $tree[] = &$menu;
                }
            }

            // 3️⃣ SORT children
            foreach ($tree as &$parent) {
                if (!empty($parent['children'])) {
                    usort($parent['children'], fn ($a, $b) =>
                        $a['order_no'] <=> $b['order_no']
                    );
                }
            }

            // 4️⃣ SORT parent
            usort($tree, fn ($a, $b) =>
                $a['order_no'] <=> $b['order_no']
            );

            return $tree;
        });
    }
}
