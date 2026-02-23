<?php

namespace App\Services;

use App\Repositories\MsPaymentMethodRepository;
use App\Helpers\CryptoHelper;  

class PaymentMethodService
{
    protected $repository;

    public function __construct(MsPaymentMethodRepository $repository)
    {
        $this->repository = $repository;
    }

   public function getDataList($tenantId, $keyword, $perPage)
    {
        
        $decryptedTenantId = CryptoHelper::decrypt($tenantId);
      
        if (!$decryptedTenantId) {
           
            $decryptedTenantId = is_numeric($tenantId) ? $tenantId : null;
        }

        if (!$decryptedTenantId) {
            throw new \InvalidArgumentException("Tenant ID tidak valid.");
        }

        return $this->repository->getBaseQuery((int)$decryptedTenantId, $keyword)
            ->paginate($perPage);
    }
    public function createPaymentMethod(array $data)
    {
        // 1. Dekripsi data identitas
        $data['tenant_id']  = CryptoHelper::decrypt($data['tenant_id']);
        $data['created_by'] = CryptoHelper::decrypt($data['created_by']);
        
        // 2. Normalisasi Data
        $data['type'] = strtoupper($data['type']);
        
        // 3. Logic: Jika CASH, pastikan detail rekening kosong
        if ($data['type'] === 'CASH') {
            $data['account_number'] = null;
            $data['account_name']   = null;
        }

        return $this->repository->create($data);
    }

    public function updatePaymentMethod($id, array $data)
    {
        // 1. Dekripsi ID dan data identitas
        $decryptedId        = CryptoHelper::decrypt($id);
        $decryptedTenantId  = CryptoHelper::decrypt($data['tenant_id']);
        $data['updated_by'] = CryptoHelper::decrypt($data['updated_by']);
        
        // 2. Normalisasi & Logic
        if (isset($data['type'])) {
            $data['type'] = strtoupper($data['type']);
            
            if ($data['type'] === 'CASH') {
                $data['account_number'] = null;
                $data['account_name']   = null;
            }
        }

        // 3. Bersihkan payload dari field yang tidak perlu diupdate di tabel
        unset($data['tenant_id']); 

        return $this->repository->update($decryptedId, $data, $decryptedTenantId);
    }

    public function deletePaymentMethod($id, $tenantId)
    {
        $decryptedId       = CryptoHelper::decrypt($id);
        $decryptedTenantId = CryptoHelper::decrypt($tenantId);

        return $this->repository->delete($decryptedId, $decryptedTenantId);
    }
}