<?php

namespace App\Services;

use App\Repositories\CustomerRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\Ms_Customer;
use App\Helpers\CryptoHelper;
use Illuminate\Support\Str;

class CustomerService
{
    protected $customerRepo;

    public function __construct(CustomerRepository $customerRepo)
    {
        $this->customerRepo = $customerRepo;
    }


    public function getCustomerTransaction($tenantId, $phone)
    {
        // 1. Validasi awal: Tenant harus ada dan Phone tidak boleh kosong
        if (!$tenantId || !is_numeric($tenantId) || empty($phone)) {
            return null; // Balikkan null, bukan collect() agar konsisten dengan objek tunggal
        }

        // 2. Langsung panggil repo untuk ambil satu data (Exact Match)
        // Asumsi: di Repo fungsi getCustomerByPhone sudah menggunakan ->first()
        return $this->customerRepo->getCustomerByPhone((int)$tenantId, $phone);
    }



    private function tenantId(): int
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

        if (!$tenantId) {
            abort(403, 'Tenant tidak teridentifikasi.');
        }

        return (int) $tenantId;
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public function list(array $params): LengthAwarePaginator
    {
        return $this->customerRepo->paginate($this->tenantId(), $params);
    }

    // ── Summary stats ─────────────────────────────────────────────────────────

    public function stats(): array
    {
        return $this->customerRepo->summaryStats($this->tenantId());
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    public function findOrFail(int $id): Ms_Customer
    {
        $customer = $this->customerRepo->findByTenant($id, $this->tenantId());

        if (!$customer) {
            abort(404, 'Pelanggan tidak ditemukan.');
        }

        return $customer;
    }

    // ── Lookup by phone (POS) ─────────────────────────────────────────────────

    public function findByPhone(string $phone): ?Ms_Customer
    {
        return $this->customerRepo->findByPhone($this->tenantId(), $phone);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function create(array $data): Ms_Customer
    {
        $tenantId = $this->tenantId();

        // Cek duplikasi phone dalam tenant
        if ($this->customerRepo->phoneExistsInTenant($tenantId, $data['phone'])) {
            abort(422, "Nomor telepon {$data['phone']} sudah terdaftar.");
        }

        return $this->customerRepo->create([
            'tenant_id' => $tenantId,
            'name'      => $data['name'],
            'phone'     => $data['phone'],
            'email'     => $data['email']   ?? null,
            'address'   => $data['address'] ?? null,
            'gender'    => $data['gender']  ?? null,
            'is_active' => $data['is_active'] ?? true,
            'point'     => 0,
        ]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(int $id, array $data): Ms_Customer
    {
        $tenantId = $this->tenantId();
        $customer = $this->findOrFail($id);

        // Cek duplikasi phone (kecuali milik sendiri)
        if (isset($data['phone']) &&
            $this->customerRepo->phoneExistsInTenant($tenantId, $data['phone'], $id)) {
            abort(422, "Nomor telepon {$data['phone']} sudah digunakan pelanggan lain.");
        }

        $updateData = array_filter([
            'name'      => $data['name']      ?? null,
            'phone'     => $data['phone']     ?? null,
            'email'     => $data['email']     ?? null,
            'address'   => $data['address']   ?? null,
            'gender'    => $data['gender']    ?? null,
            'is_active' => $data['is_active'] ?? null,
        ], fn ($v) => !is_null($v));

        return $this->customerRepo->update($customer, $updateData);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public function delete($id): void
    {
        $idCus = (int) CryptoHelper::decrypt($id);
        $customer = $this->findOrFail($idCus);
        $this->customerRepo->delete($customer);
    }
}
