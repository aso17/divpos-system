<?php

namespace App\Repositories;

use App\Models\Tr_Transaction;

class TransactionRepository
{
    protected $model;

    public function __construct(Tr_Transaction $model)
    {
        $this->model = $model;
    }

   public function getHistory($tenantId, $params)
{
    $perPage = $params['per_page'] ?? 10;
    $keyword = $params['keyword'] ?? null;

    return $this->model->where('tenant_id', $tenantId)
        ->when($keyword, function ($query) use ($keyword) {
            $query->where(function($q) use ($keyword) {
                // Cari berdasarkan Invoice
                $q->where('invoice_no', 'like', "%{$keyword}%")
                  // Atau cari berdasarkan nama/telp customer di tabel Ms_Customer
                  ->orWhereHas('customer', function ($queryCustomer) use ($keyword) {
                      $queryCustomer->where('name', 'like', "%{$keyword}%")
                                    ->orWhere('phone', 'like', "%{$keyword}%");
                  })
                  // Atau cari berdasarkan nama customer manual (jika ada di tabel transaksi)
                  ->orWhere('customer_name', 'like', "%{$keyword}%")
                  ->orWhere('customer_phone', 'like', "%{$keyword}%");
            });
        })
        ->with([
            'customer', 
            'outlet', 
            'details', // Sudah diperbaiki dari 'items' ke 'details'
            'initialPaymentMethod' // Tambahan agar bisa tampilkan "Cash/BCA" di history
        ]) 
        ->latest()
        ->paginate($perPage);
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