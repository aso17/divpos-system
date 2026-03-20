<?php

namespace App\Repositories;

use App\Models\Ms_customer;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;

class CustomerRepository
{
    public function getCustomerByPhone(int $tenantId, string $phone)
    {
        // Membersihkan karakter non-angka agar pencarian akurat
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);

        return Ms_customer::where('tenant_id', $tenantId)
            ->where('phone', $cleanPhone)
            ->first();
    }

    private function baseQuery(int $tenantId)
    {
        return Ms_Customer::where('tenant_id', $tenantId)
            ->whereNull('deleted_at');
    }

    // ── List dengan search + pagination ──────────────────────────────────────

    public function paginate(int $tenantId, array $params): LengthAwarePaginator
    {
        $query = $this->baseQuery($tenantId)
            ->select([
                'id', 'name', 'phone', 'email',
                'gender', 'point', 'is_active',
                'created_at',
            ]);

        // Search: nama, phone, email
        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', '%' . $keyword . '%')
                  ->orWhere('phone', 'like', $keyword . '%')
                  ->orWhere('email', 'like', $keyword . '%');
            });
        }

        // Filter status
        if (isset($params['is_active']) && $params['is_active'] !== '') {
            $query->where('is_active', filter_var($params['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        // Filter gender
        if (!empty($params['gender'])) {
            $query->where('gender', $params['gender']);
        }

        return $query
            ->orderBy('name', 'asc')
            ->paginate($params['per_page'] ?? 10);
    }

    // ── Find by ID ────────────────────────────────────────────────────────────

    public function findByTenant(int $id, int $tenantId): ?Ms_Customer
    {
        return Ms_Customer::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->select([
                'id', 'tenant_id', 'name', 'phone', 'email',
                'address', 'gender', 'point', 'is_active',
                'created_by', 'updated_by', 'created_at', 'updated_at',
            ])
            ->first();
    }

    // ── Find by phone (untuk POS lookup) ─────────────────────────────────────

    public function findByPhone(int $tenantId, string $phone): ?Ms_Customer
    {
        return Ms_Customer::where('tenant_id', $tenantId)
            ->where('phone', $phone)
            ->whereNull('deleted_at')
            ->select(['id', 'name', 'phone', 'email', 'address', 'gender', 'point', 'is_active'])
            ->first();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function create(array $data): Ms_Customer
    {
        return Ms_Customer::create($data);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Ms_Customer $customer, array $data): Ms_Customer
    {
        $customer->update($data);
        return $customer->fresh();
    }

    // ── Soft delete ───────────────────────────────────────────────────────────

    public function delete(Ms_Customer $customer): void
    {
        $customer->delete();
    }

    // ── Cek duplikasi phone dalam tenant ──────────────────────────────────────

    public function phoneExistsInTenant(int $tenantId, string $phone, ?int $excludeId = null): bool
    {
        $query = Ms_Customer::where('tenant_id', $tenantId)
            ->where('phone', $phone)
            ->whereNull('deleted_at');

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    // ── Summary stats (untuk header CustomerList) ─────────────────────────────

    public function summaryStats(int $tenantId): array
    {
        $row = DB::selectOne(
            'SELECT
                COUNT(*)                                    AS total,
                SUM(CASE WHEN is_active = true  THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) AS inactive
               FROM "Ms_customers"
              WHERE tenant_id  = ?
                AND deleted_at IS NULL',
            [$tenantId]
        );

        return [
            'total'    => (int) $row->total,
            'active'   => (int) $row->active,
            'inactive' => (int) $row->inactive,
        ];
    }
}
