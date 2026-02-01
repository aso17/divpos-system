<?php

namespace App\Http\Controllers;

use App\Models\Ms_role;
use App\Services\RoleService;
use App\Http\Resources\RoleResource;
use Illuminate\Http\Request;

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


}
