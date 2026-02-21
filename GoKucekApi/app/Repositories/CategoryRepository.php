<?php

namespace App\Repositories;

use App\Models\Ms_category;

class CategoryRepository
{
    public function getBaseQuery(int $tenantId)
    {
        return Ms_category::where('tenant_id', $tenantId);
    }

    public function findByIdAndTenant(int $id, int $tenantId)
    {
        return Ms_category::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();
    }

    public function create(array $data)
    {
        return Ms_category::create($data);
    }

    public function update(Ms_category $category, array $data)
    {
        $category->update($data);
        return $category;
    }

    public function delete(Ms_category $category)
    {
        return $category->delete();
    }
}