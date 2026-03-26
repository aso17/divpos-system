<?php

namespace App\Repositories;

use App\Models\Ms_unit;

class UnitRepository
{
    public function getUnitByTenant($tenantId)
    {
        return Ms_unit::select('id', 'name', 'short_name', 'is_decimal')
            ->where(function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId);
                // ->orWhereNull('tenant_id');
            })
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();
    }
}
