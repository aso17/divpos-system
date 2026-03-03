<?php

namespace App\Services;

use App\Models\Ms_user;
use App\Models\Ms_employee;

use App\Repositories\EmployeeRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Helpers\CryptoHelper;

class EmployeeService
{
    protected $employeeRepository;

    public function __construct(EmployeeRepository $employeeRepository)
    {
        $this->employeeRepository = $employeeRepository;
    }

    public function getAllEmployees($params)
    {
        return $this->employeeRepository->getAll($params['tenant_id'], $params['keyword'] ?? null);
    }

    /**
 * CREATE EMPLOYEE
 */
public function createEmployee(array $data,$CreatedBy)
{
    return DB::transaction(function () use ($data,$CreatedBy) {
        $userId = null;

        // 1. Handle Logic User Login (Data role_id sudah didekripsi oleh Request)
        if ($data['has_login'] ?? false) {
            $user = Ms_user::create([
                'email'      => $data['email'],
                'password'   => Hash::make($data['password']),
                'role_id'    => $data['role_id'] ?? null, // Langsung pakai
                'created_by' => $CreatedBy,
            ]);
            $userId = $user->id;
        }

        // 2. Generate Employee Code
        $year = date('y');
        $tenantIdPadded = str_pad($data['tenant_id'], 3, '0', STR_PAD_LEFT);

        $lastEmployee = Ms_employee::where('tenant_id', $data['tenant_id'])
            ->latest('id')
            ->lockForUpdate()
            ->first();

        $lastSequence = 0;
        if ($lastEmployee && $lastEmployee->employee_code) {
            $lastSequence = (int) substr($lastEmployee->employee_code, -4);
        }

        $sequence = str_pad($lastSequence + 1, 4, '0', STR_PAD_LEFT);
        $employeeCode = $year . $tenantIdPadded . $sequence;

        // 3. Create Employee Profile (Data outlet_id sudah didekripsi oleh Request)
        return Ms_employee::create([
            'user_id'       => $userId,
            'tenant_id'     => $data['tenant_id'],
            'outlet_id'     => $data['outlet_id'] ?? null, // Langsung pakai
            'employee_code' => $employeeCode,
            'full_name'     => $data['full_name'],
            'phone'         => $data['phone'] ?? null,
            'job_title'     => $data['job_title'] ?? null,
            'is_active'     => $data['is_active'] ?? true,
            'created_by'    => $CreatedBy,
        ]);
    });
}

/**
 * UPDATE EMPLOYEE
 */
    public function updateEmployee($id, $tenantId, $updatedBy, array $data)
{
    return DB::transaction(function () use ($id, $tenantId, $updatedBy, $data) {
        
        // 1. Pastikan ID didekripsi (Double Protection)
        $realId = is_numeric($id) ? $id : CryptoHelper::decrypt($id);

        $employee = Ms_employee::where('id', $realId)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        // 2. Logic Akun Login (Ms_user)
        $hasLogin = filter_var($data['has_login'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($hasLogin) {
            if ($employee->user_id) {
                // UPDATE USER LAMA
                $user = Ms_user::find($employee->user_id);
                if ($user) {
                    $userData = [
                        'email'      => $data['email'],
                        'role_id'    => $data['role_id'] ?? null,
                        'updated_by' => $updatedBy,
                    ];
                    if (!empty($data['password'])) {
                        $userData['password'] = Hash::make($data['password']);
                    }
                    $user->update($userData);
                }
            } else {
                // BUAT USER BARU
                $newUser = Ms_user::create([
                    'email'      => $data['email'],
                    'password'   => Hash::make($data['password'] ?? 'password123'),
                    'role_id'    => $data['role_id'] ?? null,
                    'created_by' => $updatedBy,
                ]);
                $employee->user_id = $newUser->id;
            }
        } else {
            
            if ($employee->user_id) {
                Ms_user::where('id', $employee->user_id)->delete();
                $employee->user_id = null;
                }
        }

        // 3. Update Profil Karyawan
        $employee->update([
            'full_name'  => $data['full_name'],
            'phone'      => $data['phone'] ?? null,
            'job_title'  => $data['job_title'] ?? null,
            'is_active'  => $data['is_active'] ?? true,
            'outlet_id'  => $data['outlet_id'] ?? null, 
            'updated_by' => $updatedBy,
            'user_id'    => $employee->user_id, // Gunakan hasil logic di atas
        ]);

        return $employee->load(['user', 'outlet']);
    });
}
    public function deleteEmployee($id, $tenantId)
    {
        $employee = $this->employeeRepository->findById($id, $tenantId);
        if (!$employee) return null;
        
        // Hapus user terkait jika ada
        if ($employee->user_id) {
            $employee->user()->delete();
        }

        return $this->employeeRepository->delete($id);
    }
}