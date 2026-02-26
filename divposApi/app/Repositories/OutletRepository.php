<?php

namespace App\Repositories;

use App\Models\Ms_outlet;

class OutletRepository
{
    protected $model;

    public function __construct(Ms_outlet $model)
    {
        $this->model = $model;
    }

   public function getQueryOutlet($tenantId, $params)
{
    $keyword = $params['keyword'] ?? null;

    return $this->model->where('tenant_id', $tenantId)
        ->when($keyword, function ($query) use ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('code', 'like', "%{$keyword}%")
                  ->orWhere('city', 'like', "%{$keyword}%");
            });
        })
        ->orderBy('is_main_branch', 'desc') 
        ->orderBy('created_at', 'desc');
}

    public function getLastOutletByTenant($tenantId)
    {
        return $this->model->where('tenant_id', $tenantId)
            ->withTrashed()
            ->orderBy('id', 'desc')
            ->first();
    }

    public function find($id, $tenantId)
    {
        return $this->model->where('tenant_id', $tenantId)->findOrFail($id);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update($id, $tenantId, array $data)
    {
        $outlet = $this->find($id, $tenantId);
        $outlet->update($data);
        return $outlet;
    }

    public function delete($id, $tenantId)
    {
        $outlet = $this->find($id, $tenantId);
        return $outlet->delete();
    }
}