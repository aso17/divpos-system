<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; 
use App\Helpers\CryptoHelper;
use App\Http\Resources\RolePermissionResource;
use App\Services\RolePermissionService; 
class RolePermissionController extends Controller
{
   protected $permissionService;

    public function __construct(RolePermissionService $service)
    {
        $this->permissionService = $service;
    }
    
    public function index(Request $request)
    {
        // 1. Decrypt Input
        $roleId   = CryptoHelper::decrypt($request->query('roleid'));
        $tenantId = CryptoHelper::decrypt($request->query('tenantid'));

        // 2. Ambil Info Role
        $role = DB::table('Ms_roles')
            ->where('id', $roleId)
            ->where('tenant_id', $tenantId)
            ->first(['role_name', 'code']);

        // 3. Panggil Service
        $permissions = $this->permissionService->getPermissionsByRole($roleId, $tenantId);

        // 4. Return via API Resource
        return response()->json([
            'status' => 'success',
            'roleid'=> $roleId,
            'data' => [
                'role' => $role,
                'permissions' => RolePermissionResource::collection($permissions)
            ]
        ]);
    }



    public function store(Request $request)
    {
        // Ambil params dari URL query string
        $roleId = decrypt($request->query('role_id'));
        $tenantId = decrypt($request->query('tenant_id'));
        
        // Ambil body dari React ( { permissions: [...] } )
        $permissions = $request->input('permissions'); 

        DB::beginTransaction();
        try {
            // 1. Hapus data lama agar tidak terjadi 'Duplicate Key' pada unique constraint
            DB::table('Ms_role_menu_permissions')
                ->where('tenant_id', $tenantId)
                ->where('role_id', $roleId)
                ->delete();

            // 2. Mapping data untuk Bulk Insert
            $dataToInsert = collect($permissions)->map(function ($p) use ($roleId, $tenantId) {
                return [
                    'tenant_id'  => $tenantId,
                    'role_id'    => $roleId,
                    'module_id'  => $p['module_id'], 
                    'menu_id'    => $p['menu_id'],
                    // Pastikan dikonversi ke boolean agar Postgres tidak protes
                    'can_view'   => filter_var($p['can_view'], FILTER_VALIDATE_BOOLEAN),
                    'can_create' => filter_var($p['can_create'], FILTER_VALIDATE_BOOLEAN),
                    'can_update' => filter_var($p['can_update'], FILTER_VALIDATE_BOOLEAN),
                    'can_delete' => filter_var($p['can_delete'], FILTER_VALIDATE_BOOLEAN),
                    'can_export' => filter_var($p['can_export'], FILTER_VALIDATE_BOOLEAN),
                    'is_active'  => true,
                    // 'created_by' => auth()->user()->username ?? 'system',
                    'created_by' => 'system',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->toArray();

            // 3. Eksekusi Insert Massal
            if (!empty($dataToInsert)) {
                DB::table('Ms_role_menu_permissions')->insert($dataToInsert);
            }

            DB::commit();
            return response()->json([
                'status'  => 'success', 
                'message' => 'Permissions saved successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 'error', 
                'message' => 'Failed to save: ' . $e->getMessage()
            ], 500);
        }
    }
}