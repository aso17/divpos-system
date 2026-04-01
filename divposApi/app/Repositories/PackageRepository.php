<?php

namespace App\Repositories;

use App\Models\Ms_package;
use Illuminate\Support\Facades\DB;

class PackageRepository
{
    public function getForTransaction(int $tenantId)
    {
        return Ms_package::select([
                'id',
                'service_id',
                'category_id',
                'tenant_id',
                'unit_id',
                'code',
                'name',
                'price',          // WAJIB: Untuk original_price
                'final_price',    // WAJIB: Untuk harga setelah diskon
                'discount_value', // WAJIB: Untuk nominal diskon
                'discount_type',  // WAJIB: Untuk label (fixed/percentage)
                'description',
                'is_weight_based'
            ])
            ->with(['unit:id,short_name'])
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->orderBy('name', 'asc')
            ->get();
    }
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
            'id',
            'tenant_id',
            'service_id',
            'category_id',
            'unit_id', // Ganti unit (string) jadi unit_id
            'code',
            'name',
            'description',
            'price',
            'discount_type',
            'discount_value',
            'final_price',
            'duration_menit',
            'is_weight_based',
            'min_order',
            'is_active',
            'created_at'
        )
            ->with([
                'service:id,name',
                'category:id,name,slug',
                'unit:id,name,short_name,is_decimal', // Tambahkan relasi unit
                'tenant:id,code'
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

    public function getLastPackageByTenant(int $tenantId)
    {
        return Ms_package::withTrashed()
            ->where('tenant_id', $tenantId)
            ->select('code')
            ->where('code', 'LIKE', 'PCK-' . date('ym') . '-%')
            ->orderBy('id', 'desc')
            ->first();
    }
    /**
     * Membuat data paket baru
     */
    public function create(array $data)
    {
        $package = Ms_package::create($data);
        return $package->load([
            'service:id,name',
            'category:id,name',
            'unit:id,name'
        ]);
    }

    /**
     * Update data paket
     */
    public function update(Ms_package $package, array $data)
    {
        $package->update($data);
        // Ambil data terbaru beserta relasinya
        return $package->fresh([
            'service:id,name',
            'category:id,name',
            'unit:id,name'
            ]);
    }

    /**
     * Hapus paket
     */
    public function delete(Ms_package $package)
    {
        return $package->delete();
    }
}
