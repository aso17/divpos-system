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
 public function createEmployee(array $data, $CreatedBy)
{
    return DB::transaction(function () use ($data, $CreatedBy) {
        $tenantId = $data['tenant_id'];
        $currentYearFull = (int)date('Y'); 
        $currentYearShort = date('y');    
        $lastEmployee = Ms_employee::withTrashed() 
            ->where('tenant_id', $tenantId)
            ->where('year', $currentYearFull) 
            ->whereNotNull('employee_code')
            ->orderBy('employee_code', 'desc')
            ->lockForUpdate()
            ->first();

        $lastSequence = 0;
        if ($lastEmployee && $lastEmployee->employee_code) {
          
            $lastSequence = (int) substr((string)$lastEmployee->employee_code, -4);
        }

        // 2. GENERATE KODE BARU (YY + TTT + SSSS)
        $nextSequence = $lastSequence + 1;
        $tenantIdPadded = str_pad($tenantId, 3, '0', STR_PAD_LEFT);
        $sequencePadded = str_pad($nextSequence, 4, '0', STR_PAD_LEFT); 
        $employeeCode = $currentYearShort . $tenantIdPadded . $sequencePadded;

        // 3. LOGIC USER LOGIN
        $userId = null;
        if (filter_var($data['has_login'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $user = Ms_user::create([
                'email'      => $data['email'],
                'password'   => Hash::make($data['password']),
                'role_id'    => $data['role_id'] ?? null,
                'created_by' => $CreatedBy,
            ]);
            $userId = $user->id;
        }

        // 4. INSERT KARYAWAN (Wajib sertakan kolom 'year')
        return Ms_employee::create([
            'user_id'       => $userId,
            'tenant_id'     => $tenantId,
            'outlet_id'     => $data['outlet_id'] ?? null,
            'year'          => $currentYearFull, 
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
        
        // 1. Dekripsi ID
        $realId = is_numeric($id) ? $id : CryptoHelper::decrypt($id);

        $employee = Ms_employee::where('id', $realId)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        // 🛡️ DETEKSI OWNER (Check menggunakan user_id lama sebelum diupdate)
        $isOwner = $this->isOwner($employee->user_id, $tenantId);

        // 2. Logic Akun Login (Ms_user)
        $hasLogin = filter_var($data['has_login'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($hasLogin) {
            if ($employee->user_id) {
                // UPDATE USER LAMA
                $user = Ms_user::find($employee->user_id);
                if ($user) {
                    $userData = [
                        'email'      => $data['email'],
                        'updated_by' => $updatedBy,
                    ];
                    // 🔒 PROTEKSI ROLE: Jika dia Owner, abaikan role_id dari request
                    if (!$isOwner) {
                        $userData['role_id'] = $data['role_id'] ?? null;
                    }

                    if (!empty($data['password'])) {
                        $userData['password'] = Hash::make($data['password']);
                    }
                    $user->update($userData);
                }
            } else {
                // BUAT USER BARU
                $newUser = Ms_user::create([
                    'tenant_id'  => $tenantId,
                    'email'      => $data['email'],
                    'password'   => Hash::make($data['password'] ?? 'password123'),
                    'role_id'    => $data['role_id'] ?? null,
                    'created_by' => $updatedBy,
                ]);
                $employee->user_id = $newUser->id;
            }
        } else {

            // 🔒 PROTEKSI DELETE LOGIN: Owner tidak boleh menghilangkan akses loginnya sendiri
            if ($employee->user_id) {
                if ($isOwner) {
                    throw new \Exception("Akses Ditolak: Akun Pemilik Utama wajib memiliki akses login.");
                }
                Ms_user::where('id', $employee->user_id)->delete();
                $employee->user_id = null;
            }
        }

        // 3. Update Profil Karyawan
        $updateData = [
            'full_name'  => $data['full_name'],
            'phone'      => $data['phone'] ?? null,
            'job_title'  => $data['job_title'] ?? null,
            'outlet_id'  => $data['outlet_id'] ?? null, 
            'updated_by' => $updatedBy,
            'user_id'    => $employee->user_id,
        ];

        // 🔒 PROTEKSI IS_ACTIVE: Owner harus selalu AKTIF
        if ($isOwner) {
            $updateData['is_active'] = true; 
        } else {
            $updateData['is_active'] = $data['is_active'] ?? true;
        }

        $employee->update($updateData);

        return $employee->load(['user.role', 'outlet']);
    });
}

    public function deleteEmployee($id, $tenantId)
    {
        return DB::transaction(function () use ($id, $tenantId) {
          
            $employee = $this->employeeRepository->findById($id, $tenantId);
           
            if (!$employee) return null;
            if ($this->isOwner($employee->user_id, $tenantId)) {
                throw new \Exception("Akses Ditolak: Akun Pemilik Utama (Owner) tidak dapat dihapus.");
            }
            if ($employee->user_id) {
               
                $employee->user()->delete();
            }

            return $this->employeeRepository->delete($id);
        });
    }

    /**
     * Validasi kepemilikan Tenant
     */
    private function isOwner($userId, $tenantId)
    {
        return DB::table('Ms_tenants')
            ->where('id', $tenantId)
            ->where('owner_id', $userId)
            ->exists();
    }
}