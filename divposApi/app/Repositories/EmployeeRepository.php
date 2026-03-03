<?php

namespace App\Repositories;

use App\Models\Ms_employee;

class EmployeeRepository
{
   public function getAll($tenantId, $keyword = null)
    {
       
        $query = Ms_employee::select(
                'Ms_employees.id',
                'Ms_employees.employee_code',
                'Ms_employees.full_name',
                'Ms_employees.job_title',
                'Ms_employees.phone',
                'Ms_employees.is_active',
                'Ms_employees.user_id',
                'Ms_outlets.name as outlet_name', 
                'Ms_outlets.id as outlet_id',
                'Ms_users.email as user_email',
                'Ms_users.role_id as user_role_id',

            )
            ->leftJoin('Ms_outlets', 'Ms_employees.outlet_id', '=', 'Ms_outlets.id')
            ->leftJoin('Ms_users', 'Ms_employees.user_id', '=', 'Ms_users.id')
            ->where('Ms_employees.tenant_id', $tenantId);

        
        if ($keyword) {
            $query->where(function($q) use ($keyword) {
                // Gunakan kolom spesifik dengan prefix tabel agar tidak ambigu
                $q->where('Ms_employees.full_name', 'like', "$keyword%") // Index friendly (kiri ke kanan)
                ->orWhere('Ms_employees.employee_code', 'like', "$keyword%")
                ->orWhere('Ms_employees.job_title', 'like', "%$keyword%")
                ->orWhere('Ms_users.email', 'like', "%$keyword%"); // Bisa cari berdasarkan email juga
            });
        }

        // 4. Selalu tambahkan sorting agar index terpakai maksimal
        return $query->orderBy('Ms_employees.created_at', 'desc');
    }

    public function findById($id, $tenantId)
    {
        return Ms_employee::where('tenant_id', $tenantId)->with(['outlet', 'user'])->find($id);
    }

    public function create(array $data)
    {
        return Ms_employee::create($data);
    }

    public function update($id, array $data)
    {
        $employee = Ms_employee::findOrFail($id);
        $employee->update($data);
        return $employee;
    }

    public function delete($id)
    {
        $employee = Ms_employee::findOrFail($id);
        return $employee->delete();
    }
    
    // Khusus untuk logika NIK
    public function getLatestByTenant($tenantId)
    {
        return Ms_employee::where('tenant_id', $tenantId)
            ->orderBy('id', 'desc')
            ->first();
    }
}