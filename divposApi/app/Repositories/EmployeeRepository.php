<?php

namespace App\Repositories;

use App\Models\Employee;

class EmployeeRepository
{
    public function getAll($tenantId, $keyword = null)
    {
        $query = Employee::where('tenant_id', $tenantId)->with(['outlet', 'user']);

        if ($keyword) {
            $query->where(function($q) use ($keyword) {
                $q->where('full_name', 'like', "%$keyword%")
                  ->orWhere('employee_code', 'like', "%$keyword%")
                  ->orWhere('job_title', 'like', "%$keyword%");
            });
        }

        return $query;
    }

    public function findById($id, $tenantId)
    {
        return Employee::where('tenant_id', $tenantId)->with(['outlet', 'user'])->find($id);
    }

    public function create(array $data)
    {
        return Employee::create($data);
    }

    public function update($id, array $data)
    {
        $employee = Employee::findOrFail($id);
        $employee->update($data);
        return $employee;
    }

    public function delete($id)
    {
        $employee = Employee::findOrFail($id);
        return $employee->delete();
    }
    
    // Khusus untuk logika NIK
    public function getLatestByTenant($tenantId)
    {
        return Employee::where('tenant_id', $tenantId)
            ->orderBy('id', 'desc')
            ->first();
    }
}