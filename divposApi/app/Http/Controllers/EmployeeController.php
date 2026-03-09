<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\EmployeeService;
use App\Http\Resources\EmployeeResource;
use App\Http\Requests\EmployeeRequest;
use App\Services\LogDbErrorService;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    protected $employeeService;
    protected $logService;

    public function __construct(EmployeeService $employeeService,LogDbErrorService $logService)
    {
        $this->employeeService = $employeeService;
        $this->logService = $logService;
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
            $tenantId = $user->employee->tenant_id; 

            if (!$tenantId) {
                return response()->json([
                    'message' => 'Profil Anda tidak terhubung ke Tenant manapun.'
                ], 403);
            }

            $payload = $request->validated();
            $payload['tenant_id'] = $tenantId;
            $employee = $this->employeeService->createEmployee($payload);
            $employee->load(['outlet']);

            return response()->json([
                'success' => true,
                'message' => 'Karyawan berhasil ditambahkan',
                'data'    => new EmployeeResource($employee),
            ], 201);

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan karyawan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(EmployeeRequest $request)
    {
        try {
            $user = Auth::user();
            $tenantId = $user->employee->tenant_id;

            if (!$tenantId) {
                return response()->json([
                    'message' => 'Akses ditolak. Tenant tidak ditemukan.'
                ], 403);
            }

            $payload = $request->validated();
            
            // Memanggil service tanpa mengirim $userId manual
            $updatedEmployee = $this->employeeService->updateEmployee($payload['id'], $tenantId, $payload);
            
            $updatedEmployee->load(['outlet']);

            return response()->json([
                'success' => true,
                'message' => 'Data karyawan ' . $updatedEmployee->full_name . ' berhasil diperbarui',
                'data'    => new EmployeeResource($updatedEmployee),
            ]);

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui data: ' . $e->getMessage()
            ], 500);
        }
    }


    public function destroy($id)
{
    try {
        $user = Auth::user();
        $tenantId = $user->employee->tenant_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        // Panggil service untuk menghapus
        $this->employeeService->deleteEmployee($id, $tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Data karyawan dan akses loginnya berhasil dihapus.'
        ]);

    } catch (\Exception $e) {
        $this->logService->log($e);
        return response()->json([
            'success' => false,
            'message' => '' . $e->getMessage()
        ], 500);
    }
}
}