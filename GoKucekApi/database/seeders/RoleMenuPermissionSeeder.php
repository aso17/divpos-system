<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleMenuPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Ambil role ID by code
        $roles = DB::table('Ms_roles')->pluck('id', 'code');

        // Ambil semua menu
        $menus = DB::table('Ms_menus')
            ->select('id', 'code', 'module_id')
            ->get();

        $permissions = [];

        /*
        |--------------------------------------------------------------------------
        | RULE DEFINITIONS
        |--------------------------------------------------------------------------
        */

        $adminExcludedMenus = ['LOGS', 'TOOLS'];

        $userAllowedMenus = [
            'DASHBOARD',
            'BILLING',
            'TIKET',
            'VOUCHER',
            'VOUCHER_PROFILE',
            'VOUCHER_STOCK',
        ];

        /*
        |--------------------------------------------------------------------------
        | SUPER ADMIN — FULL ACCESS
        |--------------------------------------------------------------------------
        */
        foreach ($menus as $menu) {
            $permissions[] = $this->permissionRow(
                roleId: $roles['SUPER_ADMIN'],
                menu: $menu,
                canView: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
                canExport: true,
                now: $now
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ADMIN — FULL ACCESS (NO DELETE, EXCEPT MENU)
        |--------------------------------------------------------------------------
        */
        foreach ($menus as $menu) {

            if (in_array($menu->code, $adminExcludedMenus)) {
                continue;
            }

            $permissions[] = $this->permissionRow(
                roleId: $roles['ADMIN'],
                menu: $menu,
                canView: true,
                canCreate: true,
                canUpdate: true,
                canDelete: false,
                canExport: true,
                now: $now
            );
        }

        /*
        |--------------------------------------------------------------------------
        | USER — LIMITED ACCESS
        |--------------------------------------------------------------------------
        */
        foreach ($menus as $menu) {

            if (!in_array($menu->code, $userAllowedMenus)) {
                continue;
            }

            $permissions[] = $this->permissionRow(
                roleId: $roles['USER'],
                menu: $menu,
                canView: true,
                canCreate: $menu->code === 'TIKET',
                canUpdate: false,
                canDelete: false,
                canExport: false,
                now: $now
            );
        }

        DB::table('Ms_role_menu_permissions')->insert($permissions);
    }

    /**
     * Helper builder supaya logic konsisten
     */
    private function permissionRow(
        int $roleId,
        object $menu,
        bool $canView,
        bool $canCreate,
        bool $canUpdate,
        bool $canDelete,
        bool $canExport,
        Carbon $now
    ): array {
        return [
            'role_id'    => $roleId,
            'module_id'  => $menu->module_id,
            'menu_id'    => $menu->id,
            'can_view'   => $canView,
            'can_create' => $canCreate,
            'can_update' => $canUpdate,
            'can_delete' => $canDelete,
            'can_export' => $canExport,
            'is_active'  => true,
            'created_by' => 'system',
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }
}
