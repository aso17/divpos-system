<?php

namespace App\Services;

use App\Models\Ms_user;
use App\Repositories\EmployeeRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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

    public function createEmployee(array $data)
    {
        return DB::transaction(function () use ($data) {
            
            // --- LOGIKA AUTO GENERATE NIK ---
            $tenantId = $data['tenant_id'];
            $lastEmployee = $this->employeeRepository->getLatestByTenant($tenantId);
            
            // Format: [TenantID]-YYYY-0001
            $year = date('Y');
            $prefix = $tenantId . '-' . $year . '-';
            
            if (!$lastEmployee) {
                $newNumber = 1;
            } else {
                // Ambil nomor urut dari NIK terakhir
                $lastCode = $lastEmployee->employee_code;
                $lastNumber = (int)str_replace($prefix, '', $lastCode);
                $newNumber = $lastNumber + 1;
            }
            
            $data['employee_code'] = $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
            // --------------------------------

            // Handle User Login jika dicentang
            if ($data['has_login'] ?? false) {
                $user = Ms_user::create([
                    'name' => $data['full_name'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'role_id' => $data['role_id'],
                    'tenant_id' => $tenantId,
                ]);
                $data['user_id'] = $user->id;
            }

            return $this->employeeRepository->create($data);
        });
    }

    public function updateEmployee($id, $tenantId, array $data)
    {
        return DB::transaction(function () use ($id, $tenantId, $data) {
            $employee = $this->employeeRepository->findById($id, $tenantId);
            if (!$employee) return null;

            // Handle update User Login jika ada
            if ($employee->user_id && ($data['has_login'] ?? false)) {
                $employee->user()->update([
                    'email' => $data['email'],
                    'password' => $data['password'] ? Hash::make($data['password']) : $employee->user->password,
                    'role_id' => $data['role_id'],
                ]);
            } elseif (!($data['has_login'] ?? false) && $employee->user_id) {
                // Jika akses login dicabut, hapus user
                $employee->user()->delete();
                $data['user_id'] = null;
            }

            return $this->employeeRepository->update($id, $data);
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