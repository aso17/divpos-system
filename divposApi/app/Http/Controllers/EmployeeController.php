<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\EmployeeService;
use App\Http\Resources\EmployeeResource;
use App\Helpers\CryptoHelper;

class EmployeeController extends Controller
{
    protected $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    public function index(Request $request)
    {
        $tenantId = CryptoHelper::decrypt($request->query('tenant_id'));
        if (!$tenantId) return response()->json(['message' => 'Invalid tenant'], 422);

        $params = [
            'tenant_id' => $tenantId,
            'keyword' => $request->query('keyword'),
        ];

        $query = $this->employeeService->getAllEmployees($params);
        $perPage = (int) ($request->per_page ?? 10);
        $employees = $query->paginate($perPage);

        return EmployeeResource::collection($employees);
    }

    public function store(Request $request)
    {
        try {
            $decryptedTenantId = CryptoHelper::decrypt($request->tenant_id);
            if (!$decryptedTenantId) throw new \Exception("Tenant tidak valid.");

            // Validasi Input (NIK tidak perlu divalidasi karena di-generate BE)
            $request->validate([
                'full_name' => 'required|string|max:100',
                'outlet_id' => 'nullable|integer',
                'has_login' => 'boolean',
                'email' => 'required_if:has_login,1|email|unique:Ms_users,email',
                'password' => 'required_if:has_login,1|min:6',
                'role_id' => 'required_if:has_login,1|integer',
            ]);

            $payload = $request->all();
            $payload['tenant_id'] = $decryptedTenantId;

            $employee = $this->employeeService->createEmployee($payload);

            return response()->json([
                'success' => true,
                'message' => 'Karyawan berhasil ditambahkan',
                'data' => new EmployeeResource($employee),
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $decryptedId = CryptoHelper::decrypt($id);
            $decryptedTenantId = CryptoHelper::decrypt($request->tenant_id);
            if (!$decryptedId || !$decryptedTenantId) throw new \Exception("ID tidak valid.");

            $request->validate([
                'full_name' => 'required|string|max:100',
                'email' => "required_if:has_login,1|email|unique:Ms_users,email," . ($request->user_id ? CryptoHelper::decrypt($request->user_id) : 'NULL'),
            ]);

            $payload = $request->all();
            $payload['tenant_id'] = $decryptedTenantId;

            $employee = $this->employeeService->updateEmployee($decryptedId, $decryptedTenantId, $payload);

            if (!$employee) return response()->json(['message' => 'Karyawan tidak ditemukan'], 404);

            return response()->json([
                'success' => true,
                'message' => 'Karyawan berhasil diupdate',
                'data' => new EmployeeResource($employee),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
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