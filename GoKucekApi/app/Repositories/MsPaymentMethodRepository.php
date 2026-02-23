<?php

namespace App\Repositories;

use App\Models\Ms_PaymentMethod;

class MsPaymentMethodRepository
{
    /**
     * Query dasar untuk mendapatkan list data dengan filter tenant & keyword.
     */
    public function getBaseQuery(int $tenantId, $keyword = null)
    {
        return Ms_PaymentMethod::withoutGlobalScopes()
            ->from('Ms_payment_methods as pm')
            ->select([
                'pm.id', 
                'pm.name', 
                'pm.type', 
                'pm.account_number', 
                'pm.account_name', 
                'pm.description', 
                'pm.is_active', 
                'pm.created_at'
            ])
            ->where('pm.tenant_id', $tenantId)
            ->whereNull('pm.deleted_at')
            ->when($keyword, function ($query) use ($keyword) {
                $query->where(function($q) use ($keyword) {
                    // Gunakan 'like' atau 'ilike' tergantung database yang Anda pakai
                    $q->where('pm.name', 'like', '%' . $keyword . '%')
                      ->orWhere('pm.type', 'like', '%' . $keyword . '%')
                      ->orWhere('pm.account_number', 'like', '%' . $keyword . '%');
                });
            })
            ->orderBy('pm.name', 'asc');
    }

    /**
     * Simpan data baru.
     */
    public function create(array $data)
    {
        return Ms_PaymentMethod::create($data);
    }

    /**
     * Update data berdasarkan ID dan Tenant.
     */
    public function update($id, array $data, $tenantId)
    {
        // Pastikan record yang diupdate milik tenant yang bersangkutan
        $record = Ms_PaymentMethod::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        $record->update($data);
        return $record;
    }

    /**
     * Hapus data (Soft Delete).
     */
    public function delete($id, $tenantId)
    {
        $record = Ms_PaymentMethod::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return $record->delete();
    }
    
    /**
     * Temukan satu data spesifik (untuk keperluan detail/edit).
     */
    public function findById($id, $tenantId)
    {
        return Ms_PaymentMethod::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();
    }
}