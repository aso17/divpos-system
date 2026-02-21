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

    public function getPaginatedCategories(array $params)
    {
        $tenantId = CryptoHelper::decrypt($params['tenant_id']);
        $query = $this->repository->getBaseQuery($tenantId);

        if (!empty($params['keyword'])) {
            $query->where('name', 'like', '%' . $params['keyword'] . '%');
        }

        return $query->orderBy('priority', 'desc')
                     ->paginate($params['per_page'] ?? 10);
    }

    public function storeCategory(array $data)
    {
        $data['tenant_id'] = CryptoHelper::decrypt($data['tenant_id']);
        $data['created_by'] = CryptoHelper::decrypt($data['created_by']);
        
        return $this->repository->create($data);
    }

    public function updateCategory(string $encryptedId, array $data)
    {
        $id = CryptoHelper::decrypt($encryptedId);
        $tenantId = CryptoHelper::decrypt($data['tenant_id']);
        
        $category = $this->repository->findByIdAndTenant($id, $tenantId);
        if (!$category) throw new \Exception("Kategori tidak ditemukan");
        $data['tenant_id'] = $tenantId;
        $data['updated_by'] = CryptoHelper::decrypt($data['updated_by']);
        
        return $this->repository->update($category, $data);
    }

    public function deleteCategory(string $encryptedId, string $encryptedTenantId)
    {
        $id = CryptoHelper::decrypt($encryptedId);
        $tenantId = CryptoHelper::decrypt($encryptedTenantId);

        $category = $this->repository->findByIdAndTenant($id, $tenantId);
        if (!$category) throw new \Exception("Kategori tidak ditemukan");

        return $this->repository->delete($category);
    }
}