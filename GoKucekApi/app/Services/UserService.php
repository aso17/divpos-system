<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Helpers\CryptoHelper;

class UserService
{
    protected $userRepo;

    public function __construct(UserRepository $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    public function getAllUsers(array $params)
    {
        // 1. Logika Dekripsi (Business Logic)
        $tenantId = CryptoHelper::decrypt($params['tenant_id'] ?? null);
        if (!$tenantId || !is_numeric($tenantId)) {
            return null;
        }

        // 2. Panggil Base Query dari Repo
        $query = $this->userRepo->getBaseUserQuery((int)$tenantId);

        // 3. Logika Filter Keyword
        if (!empty($params['keyword'])) {
            $q = $params['keyword'];
            $query->where(function ($w) use ($q) {
                $w->where('full_name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('username', 'like', "%{$q}%");
            });
        }

        // 4. Logika Filter Role (Dekripsi lagi)
        if (!empty($params['role_id'])) {
            $roleId = CryptoHelper::decrypt($params['role_id']);
            if ($roleId && is_numeric($roleId)) {
                $query->where('role_id', $roleId);
            }
        }

        return $query->orderByDesc('id');
    }
}