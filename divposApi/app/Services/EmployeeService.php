<?php

namespace App\Services;

use App\Models\Ms_user;
use App\Models\Ms_employee;

use App\Repositories\EmployeeRepository;
use Illuminate\Support\Facades\DB;
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
 
    /**
 * CREATE EMPLOYEE
 */
public function createEmployee(array $data)
{
    return DB::transaction(function () use ($data) {
        $tenantId = $data['tenant_id'];
        $currentYearFull = (int)date('Y'); 
        
        // 1. GENERATE KODE OTOMATIS (Sequence logic tetap perlu di sini)
        $lastEmployee = Ms_employee::withTrashed() 
            ->where('tenant_id', $tenantId)
            ->where('year', $currentYearFull) 
            ->whereNotNull('employee_code')
            ->orderBy('employee_code', 'desc')
            ->lockForUpdate()
            ->first();

        $lastSequence = $lastEmployee ? (int) substr((string)$lastEmployee->employee_code, -4) : 0;
        $nextSequence = $lastSequence + 1;
        $tenantIdPadded = str_pad($tenantId, 3, '0', STR_PAD_LEFT);
        $sequencePadded = str_pad($nextSequence, 4, '0', STR_PAD_LEFT); 
        $employeeCode = date('y') . $tenantIdPadded . $sequencePadded;

        // 2. INSERT KARYAWAN (created_by otomatis dihandle Model)
        return Ms_employee::create([
            'tenant_id'     => $tenantId,
            'outlet_id'     => $data['outlet_id'] ?? null,
            'year'          => $currentYearFull, 
            'employee_code' => $employeeCode,
            'full_name'     => $data['full_name'],
            'phone'         => $data['phone'] ?? null,
            'job_title'     => $data['job_title'] ?? null,
            'is_active'     => $data['is_active'] ?? true,
            'user_id'       => null, 
        ]);
    });
}

/**
 * UPDATE EMPLOYEE
 */
public function updateEmployee($id, $tenantId, array $data)
{
    return DB::transaction(function () use ($id, $tenantId, $data) {
        
        // 1. Dekripsi & Cari Data
        $realId = is_numeric($id) ? $id : CryptoHelper::decrypt($id);

        $employee = Ms_employee::where('id', $realId)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        // 2. Proteksi Status Owner (Agar owner tidak bisa di-nonaktifkan)
        $isOwnerAccount = $employee->user && $employee->user->is_owner;

        // 3. Update Profil (updated_by otomatis dihandle Model)
        $updateData = [
            'full_name'  => $data['full_name'],
            'phone'      => $data['phone'] ?? null,
            'job_title'  => $data['job_title'] ?? null,
            'outlet_id'  => $data['outlet_id'] ?? null, 
        ];

        // Override status aktif jika dia Owner
        $updateData['is_active'] = $isOwnerAccount ? true : ($data['is_active'] ?? true);

        $employee->update($updateData);

        return $employee;
    });
}

   /**
 * DELETE EMPLOYEE
 */
    public function deleteEmployee($id, $tenantId)
    {
        return DB::transaction(function () use ($id, $tenantId) {
            // 1. Dekripsi & Cari Data
            $realId = is_numeric($id) ? $id : CryptoHelper::decrypt($id);

            $employee = Ms_employee::where('id', $realId)
                ->where('tenant_id', $tenantId)
                ->firstOrFail();

            // 2. 🛡️ PROTEKSI: Jangan biarkan Owner menghapus dirinya sendiri
            if ($employee->user && $employee->user->is_owner) {
                throw new \Exception("Akses Ditolak: Data Pemilik Utama (Owner) tidak dapat dihapus.");
            }

            // 3. Hapus Akun Login (Jika ada)
            if ($employee->user_id) {
                // Jika Mas pakai SoftDelete di model User:
                Ms_user::where('id', $employee->user_id)->delete();
            }

            // 4. Hapus Data Karyawan (Soft Delete)
            $employee->delete();

            return true;
        });
    }

   
}