<?php

namespace App\Repositories;

use App\Models\Tr_Transaction;
use App\Models\Ms_Package;

class TransactionRepository
{
    protected $model;

    public function __construct(Tr_Transaction $model)
    {
        $this->model = $model;
    }

    public function getBaseQuery($tenantId, $outletId = null)
    {
        $query = Tr_Transaction::where('tenant_id', $tenantId);

        // Logic: Jika outletId ada (berarti user kasir/cabang), kunci datanya
        if ($outletId) {
            $query->where('outlet_id', $outletId);
        }

        return $query;
    }


   public function getLastInvoice($tenantId, $yearNow, $monthNow)
    {
        return $this->model
            ->withTrashed()
            // Ambil queue_number dan order_date juga
            ->select(['id', 'invoice_no', 'queue_number', 'order_date']) 
            ->where('tenant_id', $tenantId)
            ->where('order_year', $yearNow)
            ->where('order_month', $monthNow)
            ->orderBy('id', 'desc')
            ->lockForUpdate() // Mengunci baris terakhir untuk keamanan
            ->first();
    }

    public function getPackagesByIds(array $ids)
    {
        return \App\Models\Ms_Package::with('unit')
            ->whereIn('id', $ids)
            ->where('is_active', true)
            ->get();
    }


    public function getPackageById($packageId)
    {
        return Ms_Package::with(['unit'])
            ->where('is_active', true)
            ->find($packageId);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function find($id, $tenantId)
    {
        return $this->model->where('tenant_id', $tenantId)->findOrFail($id);
    }

    public function update($id, $tenantId, array $data)
    {
        $transaction = $this->find($id, $tenantId);
        $transaction->update($data);
        return $transaction;
    }

    public function delete($id, $tenantId)
    {
        $transaction = $this->find($id, $tenantId);
        return $transaction->delete();
    }
}