<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\CryptoHelper;
use App\Services\RolePermissionService;
use App\Http\Resources\RolePermissionResource;

class RolePermissionController extends Controller
{
    protected $service;

    public function __construct(RolePermissionService $service)
    {
        $this->service = $service;
    }

   public function index(Request $request)
    {
        $roleId = CryptoHelper::decrypt($request->query('roleid'));
        
        
        if (!$roleId) {
            return response()->json(['status' => 'error', 'message' => 'Invalid Role ID'], 400);
        }

        $result = $this->service->getRoleWithPermissions($roleId);

        if (!$result['role']) {
            return response()->json(['status' => 'error', 'message' => 'Role tidak ditemukan'], 404);
        }

        return response()->json([
            'status' => 'success',
            'role'   => $result['role'],
            'data'   => RolePermissionResource::collection($result['permissions'])
        ]);
    }

    public function store(Request $request)
    {
        try {
            
            $roleId = CryptoHelper::decrypt($request->input('roleid'));
            $this->service->syncPermissions($roleId, $request->input('permissions'));

            return response()->json([
                'status' => 'success',
                'message' => 'Mapping menu berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                // 'role' =>$roleId,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}