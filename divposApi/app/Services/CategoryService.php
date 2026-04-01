<?php

namespace App\Services;

use App\Repositories\CategoryRepository;
use App\Helpers\CryptoHelper;

class CategoryService
{
    protected $repository;

    public function __construct(CategoryRepository $repository)
    {
        $this->repository = $repository;
    }

    public function getAllCategoriesTransaction(int $tenantId)
    {
        return $this->repository->getAllForTransaction($tenantId);
    }
    public function getPaginatedCategories(array $params)
    {
        $tenantId = $params['tenant_id'];
        $query = $this->repository->getBaseQuery($tenantId);

        if (!empty($params['keyword'])) {
            $query->where('name', 'like', '%' . $params['keyword'] . '%');
        }

        return $query->orderBy('priority', 'desc')
                     ->paginate($params['per_page'] ?? 10);
    }

    public function storeCategory(array $data)
    {

        return $this->repository->create($data);
    }

    public function updateCategory($id, $tenantId, array $data)
    {


        $category = $this->repository->findByIdAndTenant((int)$id, (int)$tenantId);
        if (!$category) {
            throw new \Exception("Kategori tidak ditemukan".$tenantId."".$id);
        }
        $data['tenant_id'] = $tenantId;

        return $this->repository->update($category, $data);
    }

    public function deleteCategory(string $id, int $tenantId)
    {
        $realId = CryptoHelper::decrypt($id);
        $category = $this->repository->findByIdAndTenant($realId, $tenantId);

        if (!$category) {
            throw new \Exception("Kategori tidak ditemukan.");
        }

        // 🛡️ SECURITY & INTEGRITY CHECK
        // Cek apakah ada package yang masih bergantung pada kategori ini
        if ($category->packages()->exists()) {
            throw new \Exception(
                "Gagal menghapus! Kategori ini masih memiliki paket layanan aktif. " .
                "Silakan hapus atau pindahkan paket tersebut terlebih dahulu."
            );
        }

        return $this->repository->delete($category);
    }
}
