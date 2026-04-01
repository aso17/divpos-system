<?php

namespace App\Services;

use App\Repositories\ServiceRepository;
use Illuminate\Support\Facades\Auth;
use App\Models\Ms_package;
use App\Models\Ms_service;
use App\Helpers\CryptoHelper;
use Exception;

class MasterService
{
    protected $serviceRepo;

    public function __construct(ServiceRepository $serviceRepo)
    {
        $this->serviceRepo = $serviceRepo;
    }
    public function getAllServicesTransaction(int $tenantId)
    {
        return $this->serviceRepo->getAllForTransaction($tenantId);
    }
    public function getServicesForDropdown($encryptedTenantId)
    {
        $tenantId = CryptoHelper::decrypt($encryptedTenantId);
        if (!$tenantId) {
            return collect();
        }

        return $this->serviceRepo->getActiveServices((int)$tenantId);
    }

    public function getPaginatedServices(array $params)
    {
        $tenantId = $params['tenant_id'];
        if (!$tenantId) {
            return null;
        }

        $query = $this->serviceRepo->getBaseQuery((int)$tenantId);

        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->where('name', 'like', "%{$keyword}%");
        }

        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Logika Bisnis Simpan Layanan
     */
    public function createMasterService(array $data)
    {

        return $this->serviceRepo->create($data);
    }

    /**
     * Logika Bisnis Update Layanan
     */
    public function updateMasterService($id, array $data)
    {

        $tenantId = $data['tenant_id'] ?? Auth::user()->employee?->tenant_id;

        $service = $this->serviceRepo->update((int)$id, (int)$tenantId, $data);

        if (!$service) {
            throw new \Exception("Gagal memperbarui layanan atau data tidak ditemukan.");
        }

        return $service;
    }

    public function deleteMasterService(int $id, int $tenantId)
    {
        // 1. Cek apakah layanan digunakan di Master Paket
        $hasPackages = Ms_package::where('service_id', $id)
            ->where('tenant_id', $tenantId)
            ->exists();

        if ($hasPackages) {

            throw new \Exception("Layanan tidak bisa dihapus karena masih digunakan dalam Master Paket.");
        }

        // 2. Cari data dan pastikan milik tenant tersebut
        $service = Ms_service::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$service) {
            throw new \Exception("Data tidak ditemukan atau Anda tidak memiliki akses.");
        }

        return $service->delete();
    }
}
