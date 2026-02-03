<?php

namespace App\Repositories;

use App\Models\Ms_role;

class RoleRepository
{
    /**
     * Query dasar yang selalu terfilter berdasarkan tenant_id
     */
    public function getBaseQuery(int $tenantId)
    {
        return Ms_role::where('tenant_id', $tenantId);
    }

    /**
     * Untuk dropdown: hanya role aktif
     */
    public function getActiveRoles(int $tenantId)
    {
        return $this->getBaseQuery($tenantId)
            ->select('id', 'role_name', 'code', 'description')
            ->where('is_active', true)
            ->orderBy('role_name')
            ->get();
    }

    /**
     * Cari satu role berdasarkan ID dan Tenant (Security Check)
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
        return Ms_role::create($data);
    }

    /**
     * Update data berdasarkan ID
     */
    public function update(int $id, array $data)
    {
        $role = Ms_role::findOrFail($id);
        $role->update($data);
        return $role;
    }

    /**
     * Hapus data
     */
    public function delete(int $id)
    {
        $role = Ms_role::findOrFail($id);
        return $role->delete();
    }

    /**
     * Cek apakah kode sudah dipakai di tenant tersebut
     * Digunakan saat Create (tanpa excludeId) dan Update (dengan excludeId)
     */
    public function checkCodeExists(int $tenantId, string $code, $excludeId = null)
    {
        return $this->getBaseQuery($tenantId)
            ->where('code', $code)
            ->when($excludeId, function ($q) use ($excludeId) {
                $q->where('id', '!=', $excludeId);
            })
            ->exists();
    }
}