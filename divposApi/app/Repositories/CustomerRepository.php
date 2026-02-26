<?php

namespace App\Repositories;

use App\Models\Ms_customer; 
use Illuminate\Support\Facades\DB;

class CustomerRepository
{
    /**
     * Mengambil base query customer berdasarkan tenant_id
     */
    public function getBaseQuery(int $tenantId)
    {
        return Ms_customer::select(
            'id', 
            'tenant_id', 
            'name', 
            'phone', 
            'address', 
            'created_at'
        )
        ->where('tenant_id', $tenantId);
    }

    /**
     * Mencari customer berdasarkan ID (umum)
     */
    public function find(int $id)
    {
        return Ms_customer::find($id);
    }

    /**
     * Mencari customer berdasarkan ID dan Tenant (Security Check)
     */
    public function findByIdAndTenant(int $id, int $tenantId)
    {
        return Ms_customer::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();
    }

    /**
     * Simpan customer baru
     */
    public function create(array $data)
    {
        return Ms_customer::create($data);
    }

    /**
     * Update data customer
     */
    public function update(Ms_customer $customer, array $data)
    {
        $customer->update($data);
        return $customer->fresh();
    }

    /**
     * Hapus customer
     */
    public function delete(Ms_customer $customer)
    {
        return $customer->delete();
    }

    /**
     * Cek apakah nomor HP sudah terdaftar di tenant yang sama
     * (Berguna untuk validasi tambahan sebelum create)
     */
    public function findByPhone(int $tenantId, string $phone)
    {
        return Ms_customer::where('tenant_id', $tenantId)
            ->where('phone', $phone)
            ->first();
    }
}