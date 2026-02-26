<?php

namespace App\Services;

use App\Repositories\CustomerRepository;
use App\Helpers\CryptoHelper;
use App\Models\Ms_Customer;
use Illuminate\Support\Str;

class CustomerService
{
    protected $customerRepo;

    public function __construct(CustomerRepository $customerRepo)
    {
        $this->customerRepo = $customerRepo;
    }



    /**
     * Ambil daftar customer dengan filter keyword (Nama/HP)
     */
    public function getDataList($encryptedTenantId, $keyword = null, $perPage = 10)
    {
        // 1. Dekripsi Tenant ID
        $tenantId = CryptoHelper::decrypt($encryptedTenantId);
        if (!$tenantId || !is_numeric($tenantId)) {
            return collect(); // Return empty collection jika tenant tidak valid
        }

        // 2. Ambil base query dari Repository
        $query = $this->customerRepo->getBaseQuery((int)$tenantId);

        // 3. Filter berdasarkan keyword (Nama atau Nomor HP)
        if (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('phone', 'like', "%{$keyword}%");
            });
        }

        return $query->orderByDesc('id')->paginate($perPage);
    }

    /**
     * Simpan Customer Baru
     */
    public function createCustomer(array $data)
    {
        try {
            // 1. Dekripsi Identity
            $tenantId = CryptoHelper::decrypt($data['tenant_id']);
            if (!$tenantId) throw new \Exception("Tenant ID tidak valid.");

            $data['tenant_id'] = (int) $tenantId;
            
            // Dekripsi audit trail user
            $decryptedUser = CryptoHelper::decrypt($data['created_by']) ?? $data['created_by'];
            $data['created_by'] = substr(strip_tags($decryptedUser), 0, 50);

            // 2. Sanitasi Input
            $data['name'] = htmlspecialchars(strip_tags(trim(substr($data['name'], 0, 100))), ENT_QUOTES, 'UTF-8');
            
            // Bersihkan nomor HP dari karakter non-numerik (kecuali + jika ada)
            $data['phone'] = preg_replace('/[^0-9\+]/', '', $data['phone']);
            
            if (!empty($data['address'])) {
                $data['address'] = htmlspecialchars(strip_tags(trim(substr($data['address'], 0, 255))), ENT_QUOTES, 'UTF-8');
            }

            // 3. Eksekusi melalui Repository
            return $this->customerRepo->create($data);

        } catch (\Exception $e) {
            // \Log::error("Gagal create customer: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update Data Customer
     */
    public function updateCustomer($id, array $data)
    {
        try {
            // 1. Cari Model melalui Repo
            $customer = $this->customerRepo->find($id);
            if (!$customer) return null;

            // 2. Dekripsi & Sanitasi
            $tenantId = CryptoHelper::decrypt($data['tenant_id']);
            $data['tenant_id'] = (int) $tenantId;

            $decryptedUser = CryptoHelper::decrypt($data['updated_by'] ?? '') ?? $data['updated_by'];
            $data['updated_by'] = substr(strip_tags($decryptedUser), 0, 50);

            $data['name'] = htmlspecialchars(strip_tags(trim(substr($data['name'], 0, 100))), ENT_QUOTES, 'UTF-8');
            $data['phone'] = preg_replace('/[^0-9\+]/', '', $data['phone']);

            // 3. Eksekusi Update
            return $this->customerRepo->update($customer, $data);

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Hapus Customer
     */
    public function deleteCustomer($id, $encryptedTenantId)
    {
        $tenantId = CryptoHelper::decrypt($encryptedTenantId);
        
        // Cari pastikan milik tenant yang benar (Security Check)
        $customer = $this->customerRepo->findByIdAndTenant((int)$id, (int)$tenantId);

        if (!$customer) return null;

        return $this->customerRepo->delete($customer);
    }
}