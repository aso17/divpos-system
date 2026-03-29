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

    public function getHistory(int $tenantId, ?int $outletId, array $params)
    {
        $perPage = $params['per_page'] ?? 10;

        // Gunakan getBaseQuery yang sudah Mas punya (pastikan ini return Query Builder)
        $query = $this->getBaseQuery($tenantId, $outletId);

        // 1. Eager Loading & Select Kolom
        $query->with([
            'outlet:id,name,phone,city,address',
            'creator' => function ($q) {
                $q->select('id')->with(['employee:id,user_id,full_name']);
            },
            'initialPaymentMethod:id,name',
            // FIX: Sesuaikan field snapshot (employee_name) & relasi ke tabel Ms_employees
            'details' => function ($q) {
                $q->select([
                    'id',
                    'transaction_id',
                    'package_name',
                    'qty',
                    'price_per_unit',
                    'subtotal',
                    'employee_id',
                    'employee_name', // Nama snapshot saat transaksi
                    'notes'
                ])->with(['employee:id,full_name,job_title']); // Ambil data live jika diperlukan
            }
        ])->select([
            'id', 'outlet_id', 'invoice_no', 'queue_number', 'customer_name',
            'customer_phone', 'order_date', 'grand_total', 'total_paid',
            'status', 'payment_status', 'created_by', 'payment_method_id',
            'notes', 'payment_amount', 'change_amount'
             ]);

        // 2. Filter Keyword (Invoice, Phone, atau Name)
        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->where('invoice_no', 'like', $keyword . '%')
                  ->orWhere('customer_phone', 'like', $keyword . '%')
                  ->orWhere('customer_name', 'like', '%' . $keyword . '%');
            });
        }

        // 3. Filter Berdasarkan Petugas (Jika Mas ingin filter history per orang)
        if (!empty($params['employee_id'])) {
            $query->whereHas('details', function ($q) use ($params) {
                $q->where('employee_id', $params['employee_id']);
            });
        }

        // 4. Filter Payment Status
        if (!empty($params['payment_status']) && $params['payment_status'] !== 'ALL') {
            if ($params['payment_status'] === 'UNPAID') {
                $query->whereIn('payment_status', [
                    Tr_Transaction::PAY_UNPAID,
                    Tr_Transaction::PAY_PARTIAL
                ]);
            } else {
                $query->where('payment_status', Tr_Transaction::PAY_PAID);
            }
        }

        // 5. Filter Order Status
        if (!empty($params['status']) && $params['status'] !== 'ALL') {
            $query->where('status', $params['status']);
        }

        // 6. Sortir Terbaru & Paginate
        return $query->orderBy('order_date', 'desc')->paginate($perPage);
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
