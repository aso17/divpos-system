<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\EmployeeService;
use App\Http\Resources\EmployeeResource;
use App\Http\Requests\EmployeeRequest;
use App\Helpers\CryptoHelper;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    protected $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee->tenant_id;
      if (!$tenantId) {
        return response()->json([
            'message' => 'Access denied. You do not have permission to perform this action.'
        ], 403);
         }

        $params = [
            'tenant_id' => $tenantId,
            'keyword' => $request->query('keyword'),
        ];

        $query = $this->employeeService->getAllEmployees($params);
        $perPage = (int) ($request->per_page ?? 10);
        $employees = $query->paginate($perPage);

        return EmployeeResource::collection($employees);
    }

    public function store(EmployeeRequest $request)
    {
        try {

        $user = Auth::user();
        $tenantId = $user->tenant_id;

        if (!$tenantId) {
            return response()->json([
                'message' => 'Access denied. You do not have permission to perform this action.'
            ], 403);
        }
           
            $payload = $request->validated();         
            $payload['tenant_id'] = $tenantId;  
            $payload['created_by'] = $user->id;
            $userId = $user->id;

            if (!$payload['tenant_id']) {
                throw new \Exception("Akses ditolak: Anda tidak terhubung ke Tenant manapun.");
            }
            $employee = $this->employeeService->createEmployee($payload, $userId);
            
            $employee->load(['user.role', 'outlet']);

            return response()->json([
                'success' => true,
                'message' => 'Karyawan berhasil ditambahkan',
                'data'    => new EmployeeResource($employee),
            ], 201);

        } catch (\Exception $e) {
            // Berikan pesan error yang lebih informatif
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan karyawan: ' . $e->getMessage()
            ], 500);
        }
    }

   public function update(EmployeeRequest $request, $id)
    {
        try {
            
            $user = Auth::user();
            $tenantId = $user->tenant_id;
            
            if (!$tenantId) {
                return response()->json([
                    'message' => 'Access denied. You do not have permission to perform this action.'
                ], 403);
            }

            $payload = $request->validated();           
            $tenantId = $user->employee->tenant_id;
            $userId = $user->id; 
            $updatedEmployee = $this->employeeService->updateEmployee($payload['id'], $tenantId, $userId, $payload);
            $updatedEmployee->refresh();
            $updatedEmployee->load(['user.role', 'outlet']);

            return response()->json([
                'success' => true,
                'user_id' => $userId,
                'message' => 'Data karyawan ' . $updatedEmployee->full_name . ' berhasil diperbarui',
                'data'    => new EmployeeResource($updatedEmployee),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui data: ' . $e->getMessage()
            ], 500);
        }
    }
    public function destroy(Request $request, $id)
    {
        try {

            $decryptedId = CryptoHelper::decrypt($id);
            $decryptedTenantId = CryptoHelper::decrypt($request->query('tenant_id'));

            if (!$decryptedId || !$decryptedTenantId) throw new \Exception("Parameter tidak valid.");

            $deleted = $this->employeeService->deleteEmployee($decryptedId, $decryptedTenantId);

            if (!$deleted) return response()->json(['message' => 'Karyawan tidak ditemukan'], 404);

            return response()->json(['success' => true, 'message' => 'Karyawan berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}