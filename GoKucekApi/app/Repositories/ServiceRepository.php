<?php

namespace App\Repositories;

use App\Models\Ms_service;

class ServiceRepository
{
    /**
     * Query dasar yang selalu terfilter berdasarkan tenant_id
     * Mendukung pencarian keyword untuk nama layanan
     */
   public function getBaseQuery(int $tenantId, $keyword = null)
    {
        // Tentukan kolom yang benar-benar dibutuhkan saja
        $columns = ['id', 'name', 'description', 'is_active', 'created_at','created_by'];
        return Ms_Service::select($columns)
            ->where('tenant_id', $tenantId)
            ->when($keyword, function ($query) use ($keyword) {
            
                $query->where('name', 'like', '%' . $keyword . '%');
            });
    }
    /**
     * Untuk List Table: Mendukung Paginasi dan Search
     */
    public function getPaginated(int $tenantId, int $perPage = 10, $keyword = null)
    {
        return $this->getBaseQuery($tenantId, $keyword)
            ->orderBy('name', 'asc')
            ->paginate($perPage);
    }

    /**
     * Untuk dropdown di form Paket: hanya layanan aktif
     */
    public function getActiveServices(int $tenantId)
    {
        return $this->getBaseQuery($tenantId)
            ->select('id', 'name', 'description')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Cari satu layanan berdasarkan ID dan Tenant (Security Check)
     */
    public function findByIdAndTenant(int $id, int $tenantId)
    {
        return $this->getBaseQuery($tenantId)->where('id', $id)->first();
    }

    /**
     * Simpan data baru
     */
    public function create(array $data)
    {
        return Ms_service::create($data);
    }

    /**
     * Update data berdasarkan ID dan pastikan milik tenant
     */
    public function update(int $id, int $tenantId, array $data)
    {
        $service = $this->findByIdAndTenant($id, $tenantId);
        if (!$service) return null;
        
        $service->update($data);
        return $service;
    }

    /**
     * Hapus data (Soft Delete)
     */
    public function delete(int $id, int $tenantId)
    {
        $service = $this->findByIdAndTenant($id, $tenantId);
        if (!$service) return false;
        
        return $service->delete();
    }

    /**
     * Validasi unik nama layanan di dalam satu tenant
     */
    public function isNameDuplicate(int $tenantId, string $name, $excludeId = null)
    {
        return $this->getBaseQuery($tenantId)
            ->where('name', $name)
            ->when($excludeId, function ($q) use ($excludeId) {
                $q->where('id', '!=', $excludeId);
            })
            ->exists();
    }
}