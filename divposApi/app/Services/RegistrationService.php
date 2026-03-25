<?php

namespace App\Services;

use App\Models\Ms_tenant;
use App\Models\Ms_user;
use App\Models\Ms_role;
use App\Repositories\BusinessTypeRepository;
use App\Repositories\LogDbErrorRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException;

class RegistrationService
{
    protected $businessRepo;
    protected $logDbErrorRepo;

    public function __construct(
        BusinessTypeRepository $businessRepo,
        LogDbErrorRepository $logDbErrorRepo
    ) {
        $this->businessRepo   = $businessRepo;
        $this->logDbErrorRepo = $logDbErrorRepo;
    }

    public function getBusinessTypesForRegistration()
    {
        return $this->businessRepo->getAll();
    }

    /**
     * Alur Registrasi Utama dengan Proteksi Transaksi & Race Condition
     */
    public function registerNewTenant(array $data): array
    {
        return DB::transaction(function () use ($data) {
            try {
                // 1. GENERATE TENANT IDENTITY
                $tenantCode = 'TNT-' . strtoupper(Str::random(6));
                $tenantSlug = Str::slug($data['name']) . '-' . strtolower(Str::random(4));

                // 2. CREATE TENANT (owner_id diisi setelah user dibuat)
                $tenant = Ms_tenant::create([
                    'name'             => $data['name'],
                    'slug'             => $tenantSlug,
                    'code'             => $tenantCode,
                    'business_type_id' => $data['business_type_id'],
                    'email'            => $data['email'],
                    'phone'            => $data['phone'],
                    'address'          => $data['address'],
                    'is_active'        => true,
                ]);

                // 3. CREATE ROLE "OWNER"
                $roleOwner = Ms_role::create([
                    'tenant_id'   => $tenant->id,
                    'role_name'   => 'OWNER',
                    'code'        => 'OWNER',
                    'description' => 'Pemilik Bisnis (Full Access)',
                    'is_active'   => true,
                ]);

                // 4. CREATE USER (OWNER) — username dijamin unique
                $user = Ms_user::create([
                    'tenant_id' => $tenant->id,
                    'role_id'   => $roleOwner->id,
                    'email'     => $data['email'],
                    'username'  => $this->generateUniqueUsername($data['email']),
                    'password'  => Hash::make($data['password']),
                    'is_active' => true,
                ]);

                // 5. UPDATE OWNER_ID DI TENANT (Cross-reference)
                $tenant->update(['owner_id' => $user->id]);

                // 6. CREATE OWNER AS FIRST EMPLOYEE (Anti-Race dengan lockForUpdate)
                $this->createOwnerAsEmployee($tenant, $user, $data);

                // 7. MAPPING MODUL & SEED PERMISSIONS (Single Query, bukan N+1)
                $this->mapModulesToBusiness($tenant->business_type_id, $user->id);

                // 8. SEED PERMISSIONS OWNER (Bulk insert)
                $this->seedOwnerPermissions($tenant->id, $roleOwner->id, $user->id, $tenant->business_type_id);

                // 9. INSERT DEFAULT PAYMENT METHODS (Bulk insert)
                $this->seedDefaultPaymentMethods($tenant->id, $user->id);

                return [
                    'success' => true,
                    'message' => 'Registrasi Bisnis Berhasil!',
                    'data'    => [
                        'tenant_name' => $tenant->name,
                        'owner_email' => $user->email,
                        'tenant_id'   => $tenant->id,
                    ],
                ];

            } catch (\Exception $e) {
                $this->handleLogError($e, $data);
                throw $e;
            }
        });
    }

    /**
     * Generate kode karyawan: YY + TenantID(3pad) + Sequence(4pad)
     * lockForUpdate() mencegah race condition pada concurrent registration
     */
    private function createOwnerAsEmployee($tenant, $user, array $data): void
    {
        $tenantId        = $tenant->id;
        $currentYearFull = (int) date('Y');
        $currentYearShort = date('y');

        // LOCK baris terakhir untuk tenant + tahun ini — aman untuk concurrent request
        $lastEmployee = DB::table('Ms_employees')
            ->where('tenant_id', $tenantId)
            ->where('year', $currentYearFull)
            ->orderByDesc('employee_code')
            ->lockForUpdate()
            ->first();

        // FIX: Ambil 4 digit terakhir sebagai sequence dengan cara yang lebih robust
        $lastSequence = 0;
        if ($lastEmployee) {
            $code = (string) $lastEmployee->employee_code;
            // Format: YY(2) + TenantID(3) + Sequence(4) = 9 karakter
            $lastSequence = (int) substr($code, -4);
        }

        $nextSequence     = $lastSequence + 1;
        $tenantIdPadded   = str_pad($tenantId, 3, '0', STR_PAD_LEFT);
        $sequencePadded   = str_pad($nextSequence, 4, '0', STR_PAD_LEFT);
        $employeeCode     = $currentYearShort . $tenantIdPadded . $sequencePadded;

        DB::table('Ms_employees')->insert([
            'user_id'       => $user->id,
            'tenant_id'     => $tenantId,
            'outlet_id'     => null,
            'year'          => $currentYearFull,
            'employee_code' => $employeeCode,
            'full_name'     => $data['full_name'], // FIX: was $data['name'] (nama bisnis)
            'phone'         => $data['phone'] ?? null,
            'job_title'     => 'Owner',
            'is_active'     => true,
            'created_by'    => $user->id,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }

    /**
     * FIX: Ganti foreach+query (N+1) dengan single upsert bulk
     */
    private function mapModulesToBusiness(int $businessTypeId, int $userId): void
    {
        $allModules = DB::table('Ms_modules')
            ->where('is_active', true)
            ->pluck('id'); // Lebih efisien dari ->get() jika hanya butuh id

        if ($allModules->isEmpty()) {
            return;
        }

        $now  = now();
        $maps = $allModules->map(fn ($moduleId) => [
            'business_type_id' => $businessTypeId,
            'module_id'        => $moduleId,
            'is_active'        => true,
            'created_at'       => $now,
            'updated_at'       => $now,
        ])->toArray();

        // Single bulk upsert — jauh lebih efisien dari foreach+updateOrInsert
        DB::table('Ms_business_module_maps')->upsert(
            $maps,
            ['business_type_id', 'module_id'], // unique keys
            ['is_active', 'updated_at']         // kolom yang di-update jika sudah ada
        );
    }

    /**
     * FIX: created_by konsisten integer, bulk insert tetap dipertahankan
     */
    private function seedOwnerPermissions(int $tenantId, int $roleId, int $userId, int $businessTypeId): void
    {
        $menus = DB::table('Ms_menus as m')
            ->join('Ms_business_module_maps as bmm', 'm.module_id', '=', 'bmm.module_id')
            ->where('bmm.business_type_id', $businessTypeId)
            ->where('bmm.is_active', true)
            ->where('m.is_active', true)
            ->select('m.id as menu_id', 'm.module_id')
            ->get();

        if ($menus->isEmpty()) {
            return;
        }

        $now         = now();
        $permissions = $menus->map(fn ($menu) => [
            'tenant_id'  => $tenantId,
            'role_id'    => $roleId,
            'module_id'  => $menu->module_id,
            'menu_id'    => $menu->menu_id,
            'can_view'   => true,
            'can_create' => true,
            'can_update' => true,
            'can_delete' => true,
            'can_export' => true,
            'is_active'  => true,
            'created_by' => $userId, // FIX: integer, bukan string cast
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        // Chunk bulk insert untuk keamanan jika menu sangat banyak
        foreach (array_chunk($permissions, 500) as $chunk) {
            DB::table('Ms_role_menu_permissions')->insert($chunk);
        }
    }

    private function seedDefaultPaymentMethods(int $tenantId, int $userId): void
    {
        $now = now();

        DB::table('Ms_payment_methods')->insert([
            [
                'tenant_id'      => $tenantId,
                'code'           => 'CASH',
                'name'           => 'Tunai',
                'type'           => 'CASH',
                'is_cash'        => true,  // Aktifkan input bayar & kembalian
                'is_dp_enabled'  => false, // Tunai biasanya lunas, tapi bisa di-true-kan jika mau
                'allow_zero_pay' => false, // Tunai harus bayar (tidak boleh 0)
                'is_active'      => true,
                'is_default'     => true,
                'created_by'     => $userId,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            [
                'tenant_id'      => $tenantId,
                'code'           => 'PAY_LATER',
                'name'           => 'Bayar Nanti / DP', // Nama lebih informatif buat user
                'type'           => 'DEBT',
                'is_cash'        => false,
                'is_dp_enabled'  => true,  // INI KUNCINYA: Izinkan input DP (misal bayar 50k dari total 100k)
                'allow_zero_pay' => true,  // Izinkan simpan meski bayar 0 (Full Hutang)
                'is_active'      => true,
                'is_default'     => false,
                'created_by'     => $userId,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
        ]);
    }
    /**
     * FIX: generateUsername dengan pengecekan uniqueness — tidak hanya rand()
     * Fallback ke UUID suffix jika setelah 10 percobaan masih collision
     */
    private function generateUniqueUsername(string $email): string
    {
        $base    = Str::slug(explode('@', $email)[0]);
        $attempt = 0;

        do {
            $suffix   = $attempt === 0 ? rand(10, 99) : rand(100, 9999);
            $username = $base . $suffix;
            $exists   = DB::table('Ms_users')
                ->whereNull('deleted_at')
                ->where('username', $username)
                ->exists();
            $attempt++;
        } while ($exists && $attempt < 10);

        // Fallback aman jika semua percobaan collision (sangat jarang)
        if ($exists) {
            $username = $base . '_' . substr(Str::uuid(), 0, 8);
        }

        return $username;
    }

    private function handleLogError(\Exception $e, array $data): void
    {
        $sql      = null;
        $bindings = [];

        if ($e instanceof QueryException) {
            $sql      = $e->getSql();
            $bindings = $e->getBindings();
        }

        $this->logDbErrorRepo->store([
            'message'    => 'Registration Failure: ' . $e->getMessage(),
            'sql_query'  => $sql,
            'bindings'   => json_encode($bindings),
            'url'        => Request::fullUrl(),
            'ip_address' => Request::ip(),
        ]);
    }
}
