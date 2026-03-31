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
            // 1. Definisikan Tenant ID secara aman
            $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

            if (!$tenantId) {
                return ['tree' => [], 'map' => []];
            }

            // 2. Deteksi Admin vs Staff
            $isAdministrator = DB::table('Ms_tenants')
                ->where('id', $tenantId)
                ->where('owner_id', $user->id)
                ->exists();

            $rows = collect();
            if ($isAdministrator) {
                $bizCode = DB::table('Ms_tenants as t')
                    ->join('Ms_business_types as bt', 'bt.id', '=', 't.business_type_id')
                    ->where('t.id', $tenantId)
                    ->value('bt.code');

                $rows = $bizCode ? MenuRepository::getByBusinessType($bizCode) : collect();
            } else {
                if ($user->role_id) {
                    $rows = MenuRepository::getByRole((int)$user->role_id, (int)$tenantId);
                }
            }

            if ($rows->isEmpty()) {
                return ['tree' => [], 'map' => []];
            }

            $menuMap = [];
            $permissions = [];

            // 3. Mapping Awal (Sertakan Module Order)
            foreach ($rows as $row) {
                $perms = [
                    'view'   => (bool)($row->can_view ?? false),
                    'create' => (bool)($row->can_create ?? false),
                    'update' => (bool)($row->can_update ?? false),
                    'delete' => (bool)($row->can_delete ?? false),
                    'export' => (bool)($row->can_export ?? false),
                ];

                $menuMap[$row->menu_id] = [
                    'id'           => $row->menu_id,
                    'name'         => $row->menu_name,
                    'icon'         => $row->icon,
                    'route'        => $row->route_name,
                    'parent_id'    => $row->parent_id,
                    'module_order' => $row->module_order ?? 0, // 🚩 Tambahkan ini dari query repository
                    'order_no'     => $row->order_no ?? 0,
                    'perms'        => $perms,
                    'children'     => []
                ];

                if ($row->route_name) {
                    $permissions[$row->route_name] = $perms;
                }
            }

            // 4. Build Tree Dasar (Reference Matching)
            $tree = [];
            foreach ($menuMap as $id => &$node) {
                $parentId = $node['parent_id'];
                if ($parentId && isset($menuMap[$parentId])) {
                    $menuMap[$parentId]['children'][] = &$node;
                } else {
                    $tree[] = &$node;
                }
            }
            unset($node);

            // 5. 🔥 RECURSIVE FILTER & MULTI-LEVEL SORTING
            $processTree = function ($nodes) use (&$processTree) {
                $result = [];

                foreach ($nodes as $node) {
                    $node['children'] = $processTree($node['children']);

                    $hasVisibleChild = !empty($node['children']);
                    $canView = $node['perms']['view'];

                    if ($canView || $hasVisibleChild) {
                        $result[] = $node;
                    }
                }

                // 🚩 SORTING FINAL: Urutkan Modul dulu, baru Order No menu
                // usort($result, function ($a, $b) {
                //     if ($a['module_order'] != $b['module_order']) {
                //         return $a['module_order'] <=> $b['module_order'];
                //     }
                //     return $a['order_no'] <=> $b['order_no'];
                // });

                return $result;
            };

            return [
                'tree' => $processTree($tree),
                'map'  => $permissions
            ];
        });
    }
}
