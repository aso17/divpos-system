<?php

namespace App\Repositories;

use App\Models\Ms_employee;
use App\Models\Ms_user;

class EmployeeRepository
{
   public function getAll($tenantId, $keyword = null)
{
    // Start dari Ms_employees
    $query = Ms_employee::select(
            'Ms_employees.id as employee_id', 
            'Ms_employees.employee_code',
            'Ms_employees.full_name',
            'Ms_employees.job_title',
            'Ms_employees.phone',
            'Ms_employees.is_active as employee_active',
            'Ms_employees.created_at as employee_created_at',
            'Ms_employees.user_id', 
            'Ms_users.email as user_email',
            'Ms_users.role_id as user_role_id',
            'Ms_outlets.id as outlet_id',
            'Ms_outlets.name as outlet_name', 
            'Ms_roles.role_name',
            'Ms_roles.code as role_code'
        )
        
        ->leftJoin('Ms_users', 'Ms_employees.user_id', '=', 'Ms_users.id')
        ->leftJoin('Ms_outlets', 'Ms_employees.outlet_id', '=', 'Ms_outlets.id')
        ->leftJoin('Ms_roles', 'Ms_users.role_id', '=', 'Ms_roles.id')
        ->where('Ms_employees.tenant_id', $tenantId)
        ->whereNull('Ms_employees.deleted_at');

    if ($keyword) {
        $query->where(function($q) use ($keyword) {
            $q->where('Ms_employees.full_name', 'ilike', "%$keyword%") 
              ->orWhere('Ms_employees.employee_code', 'ilike', "%$keyword%")
              ->orWhere('Ms_users.email', 'ilike', "%$keyword%");
        });
    }

    // Sekarang orderBy sudah sinkron dengan tabel utama
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