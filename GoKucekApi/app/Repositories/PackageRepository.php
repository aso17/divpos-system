<?php

namespace App\Repositories;

use App\Models\Ms_package;
use Illuminate\Support\Facades\DB;
class PackageRepository
{

   public function getLastCodeByPrefix(int $tenantId, string $prefix)
    {
        return Ms_package::select('code')
            ->where('tenant_id', $tenantId)
            ->where('code', 'LIKE', $prefix . '-%')
            ->orderBy('id', 'DESC')
            ->value('code'); 
    }

    public function getServiceName(int $id)
    {
        return DB::table('Ms_services')
            ->where('id', $id)
            ->select('name') 
            ->value('name');
    }

    public function getCategoryName(int $id)
    {
        return DB::table('Ms_categories')
            ->where('id', $id)
            ->select('name') 
            ->value('name');
    }

    /**
     * Base query untuk mengambil data paket berdasarkan tenant
     */
    public function getBasePackageQuery(int $tenantId)
    {
        return Ms_package::select(
            'id', 'service_id', 'category_id', 'code', 'name', 
            'description', 'price', 'unit', 'min_order', 
            'is_active', 'tenant_id', 'created_at'
        )
        ->with([
            'service:id,name', 
            'category:id,name,slug',
            'tenant:id,slug,code'
        ])
        ->where('tenant_id', $tenantId);
    }

    /**
     * Mencari satu paket berdasarkan ID dan Tenant (Security Check)
     */
    public function findByIdAndTenant(int $id, int $tenantId)
    {
        return Ms_package::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();
    }

    /**
     * Membuat data paket baru
     */
    public function create(array $data)
    {
        $package = Ms_package::create($data);
        // Load relasi agar response di frontend lengkap
        return $package->load(['service', 'category']);
    }

    /**
     * Update data paket
     */
    public function update(Ms_package $package, array $data)
    {
        $package->update($data);
        // Ambil data terbaru beserta relasinya
        return $package->fresh(['service', 'category']);
    }

    /**
     * Hapus paket
     */
    public function delete(Ms_package $package)
    {
        return $package->delete();
    }
}