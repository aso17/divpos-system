<?php

namespace App\Services;

use App\Repositories\OutletRepository;
use App\Helpers\CryptoHelper;
use Illuminate\Support\Facades\DB;

class OutletService
{
    protected $outletRepo;

    public function __construct(OutletRepository $outletRepo)
    {
        $this->outletRepo = $outletRepo;
    }

    /**
     * Mendapatkan query untuk list outlet (digunakan oleh Controller index)
     */
    public function getAllOutlets(array $params)
    {
        $decryptedTenantId = CryptoHelper::decrypt($params['tenant_id']);

        if (!$decryptedTenantId) {
            return null;
        }

        // Kita biarkan repo mengurus query builder-nya
        return $this->outletRepo->getQueryOutlet($decryptedTenantId, $params);
    }

    /**
     * Generate Kode Outlet Otomatis
     */
    public function generateOutletCode($tenantId)
    {
        $latestOutlet = $this->outletRepo->getLastOutletByTenant($tenantId);

        if (!$latestOutlet) {
            $nextNumber = 1;
        } else {
            $lastCode = $latestOutlet->code;
            // Mencari angka setelah tanda dash '-'
            $lastNumber = (int) substr($lastCode, strpos($lastCode, '-') + 1);
            $nextNumber = $lastNumber + 1;
        }

        return 'OTL-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Simpan Outlet Baru
     */
    public function createOutlet(array $data)
    {
        return DB::transaction(function () use ($data) {
            $tenantId = CryptoHelper::decrypt($data['tenant_id']);
            $created_by = CryptoHelper::decrypt($data['created_by']);

            // Jika kode kosong, generate otomatis
            $code = $data['code'] ?? $this->generateOutletCode($tenantId);

            $payload = [
                'tenant_id'      => $tenantId,
                'name'           => $data['name'],
                'code'           => strtoupper($code),
                'phone'          => $data['phone'] ?? null,
                'email'          => $data['email'] ?? null,
                'address'        => $data['address'] ?? null,
                'city'           => $data['city'] ?? null,
                'is_active'      => $data['is_active'] ?? true,
                'is_main_branch' => $data['is_main_branch'] ?? false,
                'created_by'     =>  $created_by,
            ];

            return $this->outletRepo->create($payload);
        });
    }

    /**
     * Update Data Outlet
     */
    public function updateOutlet($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $tenantId = CryptoHelper::decrypt($data['tenant_id']);
            $updated_by = CryptoHelper::decrypt($data['updated_by']);
            
            $payload = [
                'name'           => $data['name'],
                'phone'          => $data['phone'] ?? null,
                'email'          => $data['email'] ?? null,
                'address'        => $data['address'] ?? null,
                'city'           => $data['city'] ?? null,
                'is_active'      => $data['is_active'] ?? true,
                'is_main_branch' => $data['is_main_branch'] ?? false,
                'updated_by'     => $updated_by,
            ];

            // Kode biasanya tidak diupdate untuk menjaga integritas data
            return $this->outletRepo->update($id, $tenantId, $payload);
        });
    }

    /**
     * Hapus Outlet
     */
    public function deleteOutlet($id, $tenantId)
    {
       
        return $this->outletRepo->delete($id, $tenantId);
    }
}