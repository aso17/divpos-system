<?php

namespace App\Services;

use App\Repositories\OutletRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OutletService
{
    protected $outletRepo;

    public function __construct(OutletRepository $outletRepo)
    {
        $this->outletRepo = $outletRepo;
    }

    public function getAllOutlets(array $params)
    {
        $tenantId = $params['tenant_id'] ?? null;

        if (!$tenantId) return null;

        return $this->outletRepo->getQueryOutlet($tenantId, $params);
    }

    public function generateOutletCode($tenantId)
    {
        $latestOutlet = $this->outletRepo->getLastOutletByTenant($tenantId);

        if (!$latestOutlet) {
            $nextNumber = 1;
        } else {
           
            $lastCode = $latestOutlet->code;
            $lastNumber = (int) substr($lastCode, -4);
            $nextNumber = $lastNumber + 1;
        }

        return 'OTL-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Logic: Create dengan DB Transaction
     * Security: Data sudah bersih dari OutletRequest
     */
    public function createOutlet(array $data)
    {
        return DB::transaction(function () use ($data) {
            $tenantId = $data['tenant_id'];

            // Logic: Kode otomatis jika tidak dikirim dari FE
            $code = $data['code'] ?? $this->generateOutletCode($tenantId);

            $payload = [
                'tenant_id'      => $tenantId,
                'name'           => $data['name'],
                'code'           => strtoupper($code),
                'phone'          => $data['phone'] ?? null,
                'email'          => $data['email'] ?? null,
                'address'        => $data['address'] ?? null,
                'description'    => $data['description'] ?? null,
                'city'           => $data['city'] ?? null,
                'is_active'      => $data['is_active'] ?? true,
                'is_main_branch' => $data['is_main_branch'] ?? false,
               
            ];

            return $this->outletRepo->create($payload);
        });
    }

    /**
     * Logic: Update dengan Proteksi Tenant
     */
    public function updateOutlet($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            // Security: Pastikan tenant_id disertakan untuk mencegah lintas tenant (IDOR)
            $tenantId = $data['tenant_id'];

            $payload = [
                'name'           => $data['name'],
                'phone'          => $data['phone'] ?? null,
                'email'          => $data['email'] ?? null,
                'address'        => $data['address'] ?? null,
                'description'    => $data['description'] ?? null,
                'city'           => $data['city'] ?? null,
                'is_active'      => $data['is_active'] ?? true,
                'is_main_branch' => $data['is_main_branch'] ?? false,
            ];

            $updated = $this->outletRepo->update($id, $tenantId, $payload);
            
            if (!$updated) {
                throw new \Exception("Gagal mengupdate: Data tidak ditemukan atau akses ditolak.");
            }

            return $updated;
        });
    }

    public function deleteOutlet($id, $tenantId)
    {
        return $this->outletRepo->delete($id, $tenantId);
    }
}