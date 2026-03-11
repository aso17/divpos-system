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


  public function getForTransaction(int $tenantId)
    {
        return Ms_outlet::select([
                'id', 
                'name', 
                'code', 
                'address', 
                'is_main_branch'
            ])
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('is_main_branch', 'desc') 
            ->orderBy('name', 'asc')
            ->get();
    }

  public function getQueryOutlet($tenantId, $params)
{
    $keyword = $params['keyword'] ?? null;
    $isActive = $params['is_active'] ?? null;

    return $this->model
       
        ->select([
            'id', 
            'tenant_id', 
            'name', 
            'code', 
            'phone', 
            'address',
            'description',
            'city', 
            'is_active', 
            'is_main_branch', 
            'created_at'
        ])
        
       
        ->where('tenant_id', $tenantId)
        
        // Filter status aktif
        ->when($isActive !== null, function ($query) use ($isActive) {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        })

        ->when($keyword, function ($query) use ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $search = "%{$keyword}%";
                $q->where('name', 'ILIKE', $search)
                  ->orWhere('code', 'ILIKE', $search)
                  ->orWhere('city', 'ILIKE', $search);
            });
        })

        ->orderByDesc('is_main_branch') 
        ->orderByDesc('created_at');
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