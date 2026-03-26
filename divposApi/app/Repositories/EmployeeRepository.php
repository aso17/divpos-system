<?php

namespace App\Repositories;

use App\Models\Ms_employee;
use Illuminate\Support\Facades\DB;

class EmployeeRepository
{
    public function getAll($tenantId, $keyword = null, $isActive = null, $outletId = null)
    {
        $query = Ms_employee::query()
            ->where('Ms_employees.tenant_id', $tenantId)
            ->whereNull('Ms_employees.deleted_at');

        // ✅ FILTER STATUS (index friendly)
        if ($isActive !== null && $isActive !== '') {
            $query->where('Ms_employees.is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

        // ✅ FILTER OUTLET (index friendly)
        if (!empty($outletId)) {
            $query->where('Ms_employees.outlet_id', $outletId);
        }

        // ✅ KEYWORD SEARCH (optimized grouping)
        if (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {

                // ⚡ prioritaskan exact match dulu (lebih cepat)
                $q->where('Ms_employees.employee_code', $keyword)

                  // fallback LIKE (partial)
                  ->orWhere('Ms_employees.full_name', 'ilike', $keyword . '%'); // prefix only (index bisa kepake)

                // ⚡ join hanya kalau perlu email
                $q->orWhereExists(function ($sub) use ($keyword) {
                    $sub->select(DB::raw(1))
                        ->from('Ms_users')
                        ->whereColumn('Ms_users.id', 'Ms_employees.user_id')
                        ->where('Ms_users.email', 'ilike', $keyword . '%');
                });
            });
        }

        // ✅ SELECT belakangan (biar fleksibel)
        $query->select([
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
        ]);

        // ✅ JOIN hanya setelah filter
        $query->leftJoin('Ms_outlets', 'Ms_employees.outlet_id', '=', 'Ms_outlets.id')
              ->leftJoin('Ms_users', 'Ms_employees.user_id', '=', 'Ms_users.id')
              ->leftJoin('Ms_roles', 'Ms_users.role_id', '=', 'Ms_roles.id');

        // ✅ tambahan select join
        $query->addSelect([
            'Ms_outlets.name as outlet_name',
            'Ms_users.email as user_email',
            'Ms_roles.role_name',
            'Ms_roles.code as role_code',
        ]);

        return $query->orderByDesc('Ms_employees.created_at');
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
