<?php

namespace App\Services;

use App\Repositories\PackageRepository;
use App\Helpers\CryptoHelper;
use App\Models\Ms_Package;
use Illuminate\Support\Str;

class PackageService
{
    protected $packageRepo;

    public function __construct(PackageRepository $packageRepo)
    {
        $this->packageRepo = $packageRepo;
    }


    public function getPackageById($id)
    {
        
        return Ms_Package::find($id);
    }

   public function generatePackageCode($encryptedTenantId, $serviceId, $categoryId)
    {
        // 1. Dekripsi data
        $tenantId = (int) CryptoHelper::decrypt($encryptedTenantId);
        $sId = (int) (CryptoHelper::decrypt($serviceId) ?? $serviceId);
        $cId = (int) (CryptoHelper::decrypt($categoryId) ?? $categoryId);

        // 2. Ambil inisial nama dari Repo
        $serviceName = $this->packageRepo->getServiceName($sId);
        $categoryName = $this->packageRepo->getCategoryName($cId);

        if (!$serviceName || !$categoryName) {
            return 'PKG-' . strtoupper(Str::random(5));
        }

        // Format Prefix (Misal: LAU-KIL)
        $prefix = strtoupper(substr($serviceName, 0, 3)) . '-' . strtoupper(substr($categoryName, 0, 3));

        // 3. Ambil kode terakhir
        $lastCode = $this->packageRepo->getLastCodeByPrefix($tenantId, $prefix);

        if (!$lastCode) {
            return $prefix . "-001";
        }

        
        $lastNumber = (int) substr($lastCode, -3);
        $nextNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);

        return $prefix . '-' . $nextNumber;
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
        try {
            // 1. Dekripsi & Casting Identity
            $tenantId = CryptoHelper::decrypt($data['tenant_id']);
            if (!$tenantId) throw new \Exception("Identity Tenant tidak valid.");

            $data['tenant_id'] = (int) $tenantId;
            
            $decryptedUser = CryptoHelper::decrypt($data['created_by']) ?? $data['created_by'];
            $data['created_by'] = substr(strip_tags($decryptedUser), 0, 50);

            $data['service_id'] = (int) ($data['service_id'] ?? 0);
            $data['category_id'] = (int) ($data['category_id'] ?? 0);
            
            $data['code'] = strtoupper(preg_replace('/[^a-zA-Z0-9\-]/', '', substr($data['code'], 0, 20)));
            
            // Name: Maksimal 100 karakter
            $data['name'] = htmlspecialchars(strip_tags(trim(substr($data['name'], 0, 100))), ENT_QUOTES, 'UTF-8');
            
            // Description: Maksimal 200 karakter (nullable)
            if (!empty($data['description'])) {
                $data['description'] = htmlspecialchars(strip_tags(trim(substr($data['description'], 0, 200))), ENT_QUOTES, 'UTF-8');
            }

            // 4. Normalisasi Angka (Decimal 12,2 dan 5,2)
            $data['price'] = abs((float) ($data['price'] ?? 0));
            $data['min_order'] = abs((float) ($data['min_order'] ?? 1.00));
            
            // Unit: Maksimal 10 karakter
            $data['unit'] = substr(strip_tags(trim($data['unit'] ?? 'Kg')), 0, 10);
            
            $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

            // 5. Kirim ke Repository
            return $this->packageRepo->create($data);

        } catch (\Exception $e) {
            // \Log::error("Gagal membuat paket: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update Data Paket
     */
   public function updatePackage($id, array $data)
    {
        try {
            // 1. Cari dulu Model-nya berdasarkan ID (Integer)
            // Kita butuh objek Ms_package untuk dikirim ke Repository
            $packageModel = \App\Models\Ms_package::find($id);

            if (!$packageModel) {
                // \Log::error("Update Gagal: Paket dengan ID {$id} tidak ditemukan.");
                return null;
            }

            // 2. Dekripsi & Sanitasi (Sama seperti store)
            $tenantId = CryptoHelper::decrypt($data['tenant_id']);
            if (!$tenantId) throw new \Exception("Tenant ID tidak valid.");
            
            $data['tenant_id'] = (int) $tenantId;

            // Dekripsi updated_by (Audit Trail)
            $decryptedUser = CryptoHelper::decrypt($data['updated_by'] ?? '') ?? $data['updated_by'];
            $data['updated_by'] = substr(strip_tags($decryptedUser), 0, 50);

            // 3. Mapping data lainnya
            $data['service_id'] = (int) $data['service_id'];
            $data['category_id'] = (int) $data['category_id'];
            $data['price'] = abs((float) $data['price']);
            $data['min_order'] = abs((float) $data['min_order']);
            $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

          
            return $this->packageRepo->update($packageModel, $data);

        } catch (\Exception $e) {
            // \Log::error("Update Error ID {$id}: " . $e->getMessage());
            return null;
        }
    }
   

    /**
     * Hapus Paket
     */
    public function deletePackage($id, $tenantId)
    {
        
        $package = $this->packageRepo->findByIdAndTenant((int)$id, (int)$tenantId);

        if (!$package) return null;

        // Logika Bisnis: Contoh jangan hapus jika ada transaksi aktif (opsional)
        // if ($package->orders()->exists()) { throw new \Exception("Paket sudah pernah digunakan dalam transaksi."); }

        $this->packageRepo->delete($package);

        return $package;
    }
}