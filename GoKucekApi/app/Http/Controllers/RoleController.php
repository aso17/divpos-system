<?php

namespace App\Http\Controllers;
use App\Services\RoleService;
use App\Http\Resources\RoleResource;
use Illuminate\Http\Request;
use App\Helpers\CryptoHelper;
class RoleController extends Controller
{

protected $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }

    public function GetRolesByTenantId(Request $request)
    {
        $roles = $this->roleService->getRolesForDropdown($request->tenant_id);
        return RoleResource::collection($roles);
    }
    
    public function index(Request $request)
    {
        $query = $this->roleService->getPaginatedRoles($request->all());

        if (!$query) {
            return response()->json(['message' => 'Invalid Tenant'], 403);
        }

        $perPage = $request->per_page ?? 10;
        $roles = $query->paginate($perPage);
        return RoleResource::collection($roles)->response()->getData(true);
    }

    public function store(Request $request)
    {
        // 1. Validasi Input
        $validated = $request->validate([
            'tenant_id'   => 'required|integer',
            'role_name'   => 'required|string|max:100',
            'code'        => 'required|string|max:50',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
            'created_by'  => 'required|string'
        ]);

        try {
            
            $role = $this->roleService->createRole($validated);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Role created successfully',
                'data' => new RoleResource($role)
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function update(Request $request, $id)
    {
        // 2. Validasi Input Update
        $validated = $request->validate([
            'role_name'   => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
            'updated_by'  => 'required|string',
            // Kita butuh tenant_id di update untuk pengecekan unique code di Service
            'tenant_id'   => 'required|integer' 
        ]);

        try {
            $role = $this->roleService->updateRole($id, $validated);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Role updated successfully',
                'data' => new RoleResource($role)
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }


    public function destroy(Request $request, $id)
{
    try {
        
        $decryptedId = CryptoHelper::decrypt($id);
        
        $encryptedTenantId = $request->query('tenant_id');
        $tenantId = $encryptedTenantId ? CryptoHelper::decrypt($encryptedTenantId) : null;

        if (!$decryptedId || !$tenantId) {
            throw new \Exception("Data tidak valid atau sudah kadaluarsa.");
        }

         $this->roleService->deleteRole((int)$decryptedId, (int)$tenantId);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Role berhasil dihapus',
            'debug' => [
                'role_id' => $decryptedId,
                'tenant_id' => $tenantId
            ]
        ]);

    } catch (\Exception $e) {
         
        return response()->json([
            'status' => 'error',
            'message' => 'Gagal menghapus data: ' . $e->getMessage()
        ], 500);
    }
}
}
