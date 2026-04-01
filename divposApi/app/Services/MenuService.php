<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use App\Repositories\MenuRepository;
use Illuminate\Support\Facades\DB;

class MenuService
{
    public static function getMenuByUser($user): array
    {
        $cacheKey = "nav_v3_{$user->id}";

        // Laravel 13: Menggunakan flexible cache (rekomendasi baru)
        // 3600 detik (1 jam) untuk fresh, 7200 detik (2 jam) toleransi data lama (stale)
        return Cache::flexible($cacheKey, [3600, 7200], function () use ($user) {

            // 1. Null-safe Tenant Discovery (L13 Style)
            $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

            if (!$tenantId) {
                return ['tree' => [], 'map' => []];
            }

            // 2. Deteksi Admin vs Staff (Optimized Query)
            $isAdministrator = DB::table('Ms_tenants')
                ->where('id', $tenantId)
                ->where('owner_id', $user->id)
                ->exists();

            $rows = match(true) {
                $isAdministrator => ($bizCode = DB::table('Ms_tenants as t')
                    ->join('Ms_business_types as bt', 'bt.id', '=', 't.business_type_id')
                    ->where('t.id', $tenantId)
                    ->value('bt.code')) ? MenuRepository::getByBusinessType($bizCode) : collect(),

                (bool)$user->role_id => MenuRepository::getByRole((int)$user->role_id, (int)$tenantId),

                default => collect()
            };

            if ($rows->isEmpty()) {
                return ['tree' => [], 'map' => []];
            }

            $menuMap = [];
            $permissions = [];

            // 3. Mapping & Flat Map
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
                    'module_order' => $row->module_order ?? 0,
                    'order_no'     => $row->order_no ?? 0,
                    'perms'        => $perms,
                    'children'     => []
                ];

                if ($row->route_name) {
                    $permissions[$row->route_name] = $perms;
                }
            }

            // 4. Build Tree
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

            // 5. 🔥 RECURSIVE FILTER & MULTI-LEVEL SORTING (L13 Optimized)
            $processTree = function ($nodes) use (&$processTree) {
                $result = [];

                foreach ($nodes as $node) {
                    $node['children'] = $processTree($node['children']);

                    // Tampilkan jika punya akses view ATAU punya anak yang aktif
                    if ($node['perms']['view'] || !empty($node['children'])) {
                        $result[] = $node;
                    }
                }



                return $result;
            };

            return [
                'tree' => $processTree($tree),
                'map'  => $permissions
            ];
        });
    }
}
