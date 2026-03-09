<?php

namespace App\Http\Controllers;
use App\Services\RoleService;
use App\Services\LogDbErrorService;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\RoleResource;
use Illuminate\Http\Request;
use App\Helpers\CryptoHelper;
use App\Http\Requests\RoleRequest;
class RoleController extends Controller
{

   protected $roleService;
   protected $logService;

    public function __construct(RoleService $roleService,LogDbErrorService $logService)
    {
        $this->roleService = $roleService;
         $this->logService = $logService;
    }

    public function GetRolesByTenantId(Request $request)
    {
         $user = Auth::user();
        $tenantId = $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized: Tenant not found.'], 403);
        }

        $roles = $this->roleService->getRolesForDropdown($tenantId);
        return RoleResource::collection($roles);
    }
    
    public function index(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized: Tenant not found.'], 403);
        }

        $params = array_merge($request->all(), [
            'tenant_id' => $tenantId 
        ]);

        $query = $this->roleService->getRoles($params);

        if (!$query) {
            return response()->json(['message' => 'Invalid or Unauthorized Tenant'], 403);
        }

        $perPage = (int) $request->input('per_page', 10);
        $roles = $query->paginate($perPage);
        return RoleResource::collection($roles)->response()->getData(true);
    }

    public function store(RoleRequest $request)
    {
        
        try {

            $payload = $request->validated();
            $payload['tenant_id'] = (int) Auth::user()->tenant_id;
            $role = $this->roleService->createRole($payload);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Role created successfully',
                'data' => new RoleResource($role)
            ], 201);
        } catch (\Exception $e) {
             $this->logService->log($e);
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function update(RoleRequest $request)
    {
       $decryptedId = $request->id;
        $payload = $request->validated();
            $payload['tenant_id'] = (int) Auth::user()->tenant_id;

        try {
            $role = $this->roleService->updateRole($decryptedId, $payload);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Role updated successfully',
                'data' => new RoleResource($role)
            ]);
        } catch (\Exception $e) {
             $this->logService->log($e);
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }


    public function destroy(Request $request, $id)
    {
        try {
            
            $decryptedId = CryptoHelper::decrypt($id);  
            $tenantId= (int) Auth::user()->employee->tenant_id;
           
            if (!$decryptedId) {
                throw new \Exception("Data tidak valid atau sudah kadaluarsa.");
            }

            $this->roleService->deleteRole((int)$decryptedId, (int)$tenantId);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Role berhasil dihapus',
                
            ]);

        } catch (\Exception $e) {
             $this->logService->log($e);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus data: ' . $e->getMessage()
            ], 500);
        }
    }
}
