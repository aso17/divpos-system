<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; 
use App\Helpers\CryptoHelper;
use App\Http\Resources\RolePermissionResource;
use App\Services\RolePermissionService; 
use App\Repositories\RolePermissionRepository; 
class RolePermissionController extends Controller
{
   protected $permissionService;
   protected $permissionRepository;

    public function __construct(RolePermissionService $service, RolePermissionRepository $repository)
    {
        $this->permissionService = $service;
        $this->permissionRepository = $repository;
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
        try {

            $roleId   = $request->input('role_id'); 
            $tenantId = $request->input('tenant_id');
            $userLog  = $request->input('created_by'); 
            $dataToInsert = $request->input('permissions');

            $dataToInsert = collect($request->input('permissions'))
                ->map(function ($p) use ($roleId, $tenantId, $userLog) {
                    $view   = filter_var($p['can_view'], FILTER_VALIDATE_BOOLEAN);
                    $create = filter_var($p['can_create'], FILTER_VALIDATE_BOOLEAN);
                    $update = filter_var($p['can_update'], FILTER_VALIDATE_BOOLEAN);
                    $delete = filter_var($p['can_delete'], FILTER_VALIDATE_BOOLEAN);
                    $export = filter_var($p['can_export'], FILTER_VALIDATE_BOOLEAN);

                    if (!$view && !$create && !$update && !$delete && !$export) return null;

                    return [
                        'tenant_id'  => $tenantId,
                        'role_id'    => $roleId,
                        'module_id'  => $p['module_id'], 
                        'menu_id'    => $p['menu_id'],
                        'can_view'   => $view,
                        'can_create' => $create,
                        'can_update' => $update,
                        'can_delete' => $delete,
                        'can_export' => $export,
                        'is_active'  => true,
                        'created_by' => $userLog,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                })
                ->filter()
                ->toArray();

            // Panggil Repository
            $permissions = $this->permissionRepository->updateRolePermissions($roleId, $tenantId, $dataToInsert);

            return response()->json(['status' => 'success', 'message' => 'Permissions updated']);
            } catch (\Exception $e) {
                return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
            }
        }
}