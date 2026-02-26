<?php

namespace App\Services;

use App\Repositories\ServiceRepository;
use App\Helpers\CryptoHelper;
use Exception;

class MasterService
{
    protected $serviceRepo;

    public function __construct(ServiceRepository $serviceRepo)
    {
        $this->serviceRepo = $serviceRepo;
    }

    /**
     * Mengambil data untuk dropdown (misal untuk form paket)
     */
    public function getServicesForDropdown($encryptedTenantId)
    {
        $tenantId = CryptoHelper::decrypt($encryptedTenantId);
        if (!$tenantId) return collect();

        return $this->serviceRepo->getActiveServices((int)$tenantId);
    }

    /**
     * Mengambil data dengan paginasi dan filter pencarian
     */
    public function getPaginatedServices(array $params)
    {
        $tenantId = CryptoHelper::decrypt($params['tenant_id'] ?? null);
        if (!$tenantId) return null;

        // Menggunakan base query dari repo
        $query = $this->serviceRepo->getBaseQuery((int)$tenantId);

        // Filter Keyword (Nama Layanan)
        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->where('name', 'like', "%{$keyword}%");
        }

        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Logika Bisnis Simpan Layanan
     */
    public function createService(array $data)
    {
        // 1. Cek duplikasi nama layanan dalam satu tenant
        $exists = $this->serviceRepo->isNameDuplicate(
            (int)$data['tenant_id'], 
            $data['name']
        );
        
        if ($exists) {
            throw new Exception("Layanan dengan nama '{$data['name']}' sudah ada di tenant ini.");
        }

        // 2. Simpan via Repo
        return $this->serviceRepo->create($data);
    }

    /**
     * Logika Bisnis Update Layanan
     */
    public function updateService($id, array $data)
    {
        // 1. Cek duplikasi jika nama diubah (kecuali untuk ID yang sedang diedit)
        if (isset($data['name']) && isset($data['tenant_id'])) {
            $exists = $this->serviceRepo->isNameDuplicate(
                (int)$data['tenant_id'], 
                $data['name'], 
                $id
            );
            
            if ($exists) {
                throw new Exception("Layanan '{$data['name']}' sudah digunakan.");
            }
        }

        return $this->serviceRepo->update($id, (int)$data['tenant_id'], $data);
    }

    /**
     * Logika Bisnis Hapus Layanan
     */
    public function deleteService($id, $tenantId)
    {
       
        $service = $this->serviceRepo->findByIdAndTenant($id, (int)$tenantId);
        if (!$service) {
            throw new Exception("Layanan tidak ditemukan atau Anda tidak memiliki akses.");
        }

        return $this->serviceRepo->delete($id, (int)$tenantId);
    }
}