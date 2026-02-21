<?php

namespace App\Services;

use App\Repositories\PackageRepository;
use App\Helpers\CryptoHelper;
use Illuminate\Support\Str;

class PackageService
{
    protected $packageRepo;

    public function __construct(PackageRepository $packageRepo)
    {
        $this->packageRepo = $packageRepo;
    }

    /**
     * Ambil daftar paket dengan logika dekripsi dan filter
     */
    public function getAllPackages(array $params)
    {
        // 1. Logika Dekripsi Tenant ID
        $tenantId = CryptoHelper::decrypt($params['tenant_id'] ?? null);
        if (!$tenantId || !is_numeric($tenantId)) {
            return null;
        }

        // 2. Panggil Base Query dari Repo (e.g., Package::where('tenant_id', $tenantId))
        $query = $this->packageRepo->getBasePackageQuery((int)$tenantId);

        // 3. Logika Filter Keyword (Nama atau Kode)
        if (!empty($params['keyword'])) {
            $q = $params['keyword'];
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                  ->orWhere('code', 'like', "%{$q}%");
            });
        }

        // 4. Logika Filter Kategori (Dekripsi jika ID di-encrypt)
        if (!empty($params['category_id'])) {
            $catId = CryptoHelper::decrypt($params['category_id']) ?? $params['category_id'];
            if (is_numeric($catId)) {
                $query->where('category_id', $catId);
            }
        }

        // 5. Logika Filter Layanan
        if (!empty($params['service_id'])) {
            $svcId = CryptoHelper::decrypt($params['service_id']) ?? $params['service_id'];
            if (is_numeric($svcId)) {
                $query->where('service_id', $svcId);
            }
        }

        return $query->orderByDesc('id');
    }

    /**
     * Simpan Paket Baru
     */
    public function createPackage(array $data)
    {
        // 1. Dekripsi IDs yang masuk
        $data['tenant_id'] = (int) CryptoHelper::decrypt($data['tenant_id']);
        $data['service_id'] = (int) (CryptoHelper::decrypt($data['service_id']) ?? $data['service_id']);
        $data['category_id'] = (int) (CryptoHelper::decrypt($data['category_id']) ?? $data['category_id']);

        // 2. Sanitasi & Normalisasi Data
        $data['code'] = strtoupper(strip_tags($data['code']));
        $data['name'] = strip_tags($data['name']);
        $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        $data['price'] = (float) $data['price'];
        $data['min_order'] = (float) ($data['min_order'] ?? 1);

        return $this->packageRepo->create($data);
    }

    /**
     * Update Data Paket
     */
    public function updatePackage($id, array $data)
    {
        // 1. Dekripsi ID Paket dan Tenant
        $decryptedId = CryptoHelper::decrypt($id) ?? $id;
        $tenantId = (int) CryptoHelper::decrypt($data['tenant_id']);

        // 2. Cari data via Repo untuk memastikan kepemilikan tenant
        $package = $this->packageRepo->findByIdAndTenant((int)$decryptedId, $tenantId);
        if (!$package) return null;

        // 3. Normalisasi data update
        if (isset($data['service_id'])) {
            $data['service_id'] = (int) (CryptoHelper::decrypt($data['service_id']) ?? $data['service_id']);
        }
        if (isset($data['category_id'])) {
            $data['category_id'] = (int) (CryptoHelper::decrypt($data['category_id']) ?? $data['category_id']);
        }
        
        $data['name'] = strip_tags($data['name']);
        $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);

        return $this->packageRepo->update($package, $data);
    }

    /**
     * Hapus Paket
     */
    public function deletePackage($id, $tenantId)
    {
        // $id dan $tenantId diasumsikan sudah didekripsi di Controller sesuai pola Anda
        $package = $this->packageRepo->findByIdAndTenant((int)$id, (int)$tenantId);

        if (!$package) return null;

        // Logika Bisnis: Contoh jangan hapus jika ada transaksi aktif (opsional)
        // if ($package->orders()->exists()) { throw new \Exception("Paket sudah pernah digunakan dalam transaksi."); }

        $this->packageRepo->delete($package);

        return $package;
    }
}