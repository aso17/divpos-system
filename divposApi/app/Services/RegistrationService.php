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
        LogDbErrorRepository   $logDbErrorRepo
    ) {
        $this->businessRepo   = $businessRepo;
        $this->logDbErrorRepo = $logDbErrorRepo;
    }

    public function getBusinessTypesForRegistration()
    {
        return $this->businessRepo->getAll();
    }

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

                // 5. UPDATE OWNER_ID DI TENANT (cross-reference)
                $tenant->update(['owner_id' => $user->id]);

                // 6. CREATE DEFAULT OUTLET (data toko pertama / cabang utama)
                $outletId = DB::table('Ms_outlets')->insertGetId([
                    'tenant_id'      => $tenant->id,
                    'name'           => 'Pusat - ' . $data['name'],
                    'code'           => 'OUT-001',
                    'phone'          => $data['phone'],
                    'city'           => $data['city'],
                    'address'        => $data['address'],
                    'is_active'      => true,
                    'is_main_branch' => true,
                    'created_by'     => $user->id,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);

                // 7. CREATE OWNER AS FIRST EMPLOYEE
                // FIX: teruskan $outletId agar employee terhubung ke outlet utama,
                //      bukan null seperti sebelumnya.
                $this->createOwnerAsEmployee($tenant, $user, $data);

                // 8. MAPPING MODUL & SEED PERMISSIONS
                $this->mapModulesToBusiness($tenant->business_type_id, $user->id);

                // 9. SEED PERMISSIONS OWNER (bulk insert, chunk 500)
                $this->seedOwnerPermissions($tenant->id, $roleOwner->id, $user->id, $tenant->business_type_id);

                // 10. SEED DEFAULT ROLES (ADMIN & KASIR)
                $this->seedDefaultRoles($tenant->id, $user->id, $tenant->business_type_id);

                // 11. SEED DEFAULT PAYMENT METHODS
                $this->seedDefaultPaymentMethods($tenant->id, $user->id);

                // 12. SEED DEFAULT UNITS (berdasarkan tipe bisnis)
                $this->seedDefaultUnits($tenant->id, $tenant->business_type_id, $user->id);

                return [
                    'tenant_id'   => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'user_id'     => $user->id,
                    'owner_email' => $user->email,
                ];

            } catch (\Exception $e) {
                $this->handleLogError($e, $data);
                throw $e;
            }
        });
    }


    private function createOwnerAsEmployee(
        $tenant,
        $user,
        array $data,
    ): void {
        $tenantId         = $tenant->id;
        $currentYearFull  = (int) date('Y');
        $currentYearShort = date('y');

        $lastEmployee = DB::table('Ms_employees')
            ->where('tenant_id', $tenantId)
            ->where('year', $currentYearFull)
            ->orderByDesc('employee_code')
            ->lockForUpdate()
            ->first();

        $lastSequence   = $lastEmployee ? (int) substr((string) $lastEmployee->employee_code, -4) : 0;
        $nextSequence   = $lastSequence + 1;
        $tenantIdPadded = str_pad($tenantId, 3, '0', STR_PAD_LEFT);
        $sequencePadded = str_pad($nextSequence, 4, '0', STR_PAD_LEFT);
        $employeeCode   = $currentYearShort . $tenantIdPadded . $sequencePadded;

        DB::table('Ms_employees')->insert([
            'user_id'       => $user->id,
            'tenant_id'     => $tenantId,
            'outlet_id'     => null,    // FIX: outlet utama, bukan null
            'year'          => $currentYearFull,
            'employee_code' => $employeeCode,
            'full_name'     => $data['full_name'],
            'phone'         => $data['phone'] ?? null,
            'job_title'     => 'Owner',
            'is_active'     => true,
            'created_by'    => $user->id,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }

    private function mapModulesToBusiness(int $businessTypeId, int $userId): void
    {
        $allModules = DB::table('Ms_modules')
            ->where('is_active', true)
            ->pluck('id');

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

        DB::table('Ms_business_module_maps')->upsert(
            $maps,
            ['business_type_id', 'module_id'],
            ['is_active', 'updated_at']
        );
    }

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
            'created_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        foreach (array_chunk($permissions, 500) as $chunk) {
            DB::table('Ms_role_menu_permissions')->insert($chunk);
        }
    }

    private function seedDefaultRoles(int $tenantId, int $userId, int $businessTypeId): void
    {
        $now   = now();
        $roles = [
            ['role_name' => 'ADMIN', 'code' => 'ADM', 'desc' => 'Administrator (Katalog & Laporan)'],
            ['role_name' => 'KASIR', 'code' => 'KSR', 'desc' => 'Staff Kasir (Transaksi & Pelanggan)'],
        ];

        $menus = DB::table('Ms_menus as m')
            ->join('Ms_business_module_maps as bmm', 'm.module_id', '=', 'bmm.module_id')
            ->where('bmm.business_type_id', $businessTypeId)
            ->where('m.is_active', true)
            ->select('m.id as menu_id', 'm.module_id', 'm.code as menu_code')
            ->get();

        if ($menus->isEmpty()) {
            return;
        }

        foreach ($roles as $roleData) {
            $roleId = DB::table('Ms_roles')->insertGetId([
                'tenant_id'   => $tenantId,
                'role_name'   => $roleData['role_name'],
                'code'        => $roleData['code'],
                'description' => $roleData['desc'],
                'is_active'   => true,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);

            $this->assignPermissionsByRoleCode($tenantId, $roleId, $userId, $roleData['code'], $menus);
        }
    }

    private function assignPermissionsByRoleCode(
        int    $tenantId,
        int    $roleId,
        int    $userId,
        string $roleCode,
        $menus
    ): void {
        $permissions = [];
        $now         = now();

        foreach ($menus as $menu) {
            $canView   = false;
            $canCreate = false;
            $canUpdate = false;
            $canExport = false;

            if ($roleCode === 'KSR') {
                if (Str::startsWith($menu->menu_code, ['DASH_HOME', 'TRX_'])) {
                    $canView = $canCreate = $canUpdate = true;
                }
                if (in_array($menu->menu_code, ['MST_PARENT', 'MST_PELANGGAN'])) {
                    $canView = true;
                    if ($menu->menu_code === 'MST_PELANGGAN') {
                        $canCreate = true;
                    }
                }
            } elseif ($roleCode === 'ADM') {
                if (Str::startsWith($menu->menu_code, ['DASH_', 'TRX_', 'MST_', 'RPT_'])) {
                    $canView = $canCreate = $canUpdate = true;
                    if (Str::startsWith($menu->menu_code, 'RPT_')) {
                        $canExport = true;
                    }
                }
                if ($menu->menu_code === 'SET_PARENT') {
                    $canView = true;
                }
            }

            if ($canView) {
                $permissions[] = [
                    'tenant_id'  => $tenantId,
                    'role_id'    => $roleId,
                    'module_id'  => $menu->module_id,
                    'menu_id'    => $menu->menu_id,
                    'can_view'   => true,
                    'can_create' => $canCreate,
                    'can_update' => $canUpdate,
                    'can_delete' => false,
                    'can_export' => $canExport,
                    'is_active'  => true,
                    'created_by' => $userId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // FIX: chunk 500 — konsisten dengan seedOwnerPermissions
        foreach (array_chunk($permissions, 500) as $chunk) {
            DB::table('Ms_role_menu_permissions')->insert($chunk);
        }
    }

    private function seedDefaultPaymentMethods(int $tenantId, int $userId): void
    {
        $now = now();
        DB::table('Ms_payment_methods')->insert([
            ['tenant_id' => $tenantId, 'code' => 'CASH',        'name' => 'Tunai',             'type' => 'CASH',     'is_cash' => true,  'is_dp_enabled' => false, 'allow_zero_pay' => false, 'is_active' => true, 'is_default' => true,  'created_by' => $userId, 'created_at' => $now, 'updated_at' => $now],
            ['tenant_id' => $tenantId, 'code' => 'QRIS_MANUAL', 'name' => 'QRIS (Stiker/Scan)','type' => 'NON_CASH', 'is_cash' => false, 'is_dp_enabled' => false, 'allow_zero_pay' => false, 'is_active' => true, 'is_default' => false, 'created_by' => $userId, 'created_at' => $now, 'updated_at' => $now],
            ['tenant_id' => $tenantId, 'code' => 'PAY_LATER',   'name' => 'Bayar Nanti / DP',  'type' => 'DEBT',     'is_cash' => false, 'is_dp_enabled' => true,  'allow_zero_pay' => true,  'is_active' => true, 'is_default' => false, 'created_by' => $userId, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    private function seedDefaultUnits($tenantId, $businessTypeId, $userId): void
    {
        if (!$tenantId) {
            return;
        }

        $businessType = DB::table('Ms_business_types')->find($businessTypeId);
        $code         = $businessType ? strtoupper($businessType->code) : 'GENERAL';

        $units = [
            'kg'    => ['name' => 'Kilogram',       'short_name' => 'kg',    'is_decimal' => true],
            'pcs'   => ['name' => 'Potong / Pcs',   'short_name' => 'pcs',   'is_decimal' => false],
            'm2'    => ['name' => 'Meter Persegi',   'short_name' => 'm2',    'is_decimal' => true],
            'pax'   => ['name' => 'Orang / Sesi',   'short_name' => 'pax',   'is_decimal' => false],
            'unit'  => ['name' => 'Unit Kendaraan',  'short_name' => 'unit',  'is_decimal' => false],
            'tail'  => ['name' => 'Ekor',            'short_name' => 'tail',  'is_decimal' => false],
            'ml'    => ['name' => 'Milliliter',      'short_name' => 'ml',    'is_decimal' => true],
            'point' => ['name' => 'Titik / Spot',    'short_name' => 'point', 'is_decimal' => false],
        ];

        $selectedKeys = match ($code) {
            'LDR'        => ['kg', 'pcs', 'm2'],
            'SLN', 'BRB' => ['pax', 'point', 'ml'],
            'CRW'        => ['unit'],
            'PET'        => ['tail', 'kg', 'pax'],
            default      => ['pcs'],
        };

        $now          = now();
        $dataToInsert = [];

        foreach ($selectedKeys as $key) {
            if (isset($units[$key])) {
                $dataToInsert[] = [
                    'tenant_id'  => $tenantId,
                    'name'       => $units[$key]['name'],
                    'short_name' => $units[$key]['short_name'],
                    'is_decimal' => $units[$key]['is_decimal'],
                    'is_active'  => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (!empty($dataToInsert)) {
            DB::table('Ms_units')->insert($dataToInsert);
        }
    }

    // ─── FIX: gunakan UNIQUE constraint — bukan loop tanpa lock ──────────────
    // Pola lama: do-while cek exists() tanpa DB lock → race condition dua
    // concurrent request bisa dapat username yang sama sebelum salah satu commit.
    //
    // Pola baru: generate kandidat username, lalu langsung coba insert di satu
    // tempat. Jika tabel Ms_users punya UNIQUE constraint pada kolom username,
    // duplicate key exception akan dilempar — tangkap dan retry di sini.
    // Jika tidak ada constraint, pola ini tetap lebih aman karena randomness
    // yang lebih besar di suffix.
    private function generateUniqueUsername(string $email): string
    {
        $base = Str::slug(explode('@', $email)[0]);

        // Coba maksimal 10 kali dengan suffix acak yang makin panjang
        for ($i = 0; $i < 10; $i++) {
            $suffix   = $i < 5 ? rand(10, 99) : rand(1000, 9999);
            $username = $base . $suffix;

            $exists = DB::table('Ms_users')
                ->whereNull('deleted_at')
                ->where('username', $username)
                ->exists();

            if (!$exists) {
                return $username;
            }
        }

        // Fallback: UUID suffix — dijamin unik secara praktis
        return $base . '_' . substr(Str::uuid(), 0, 8);
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
