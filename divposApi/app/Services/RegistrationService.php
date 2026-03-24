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
        $this->businessRepo = $businessRepo;
        $this->logDbErrorRepo = $logDbErrorRepo;
    }

    public function getBusinessTypesForRegistration()
    {
        return $this->businessRepo->getAll();
    }


    public function registerNewTenant(array $data)
    {
        DB::beginTransaction();
        try {
            // 1. GENERATE UNIQUE CODE & SLUG
            $tenantCode = 'TNT-' . strtoupper(Str::random(6));
            $tenantSlug = Str::slug($data['name']) . '-' . strtolower(Str::random(4));

            // 2. CREATE TENANT
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

            // 4. CREATE USER (OWNER)
            $user = Ms_user::create([
                'tenant_id' => $tenant->id,
                'role_id'   => $roleOwner->id,
                'email'     => $data['email'],
                'username'  => $this->generateUsername($data['email']),
                'password'  => Hash::make($data['password']),
                'is_active' => true,
            ]);

            // 5. UPDATE OWNER_ID
            $tenant->update(['owner_id' => $user->id]);

            // 6. [PENTING] INSERT KE Ms_business_module_maps
            // Menghubungkan Tipe Bisnis Tenant dengan Modul-Modul yang tersedia
            $this->mapModulesToBusiness($tenant->business_type_id);

            // 7. SEED DEFAULT PAYMENT METHODS
            $this->seedDefaultPaymentMethods($tenant->id, $user->id);

            // 8. SEED PERMISSIONS (Berdasarkan hasil mapping di langkah 6)
            $this->seedOwnerPermissions($tenant->id, $roleOwner->id, $user->id, $tenant->business_type_id);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Registrasi Berhasil!',
                'data'    => ['tenant_name' => $tenant->name]
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            $this->handleLogError($e, $data);
            throw $e;
        }
    }

    /**
     * Mendaftarkan Modul ke Tipe Bisnis di tabel Ms_business_module_maps
     */
    private function mapModulesToBusiness($businessTypeId)
    {
        // Ambil semua modul yang aktif secara global
        $allModules = DB::table('Ms_modules')->where('is_active', true)->get();

        $businessMaps = [];
        foreach ($allModules as $module) {
            // Cek dulu apakah mapping ini sudah ada (biar tidak duplicate)
            $exists = DB::table('Ms_business_module_maps')
                ->where('business_type_id', $businessTypeId)
                ->where('module_id', $module->id)
                ->exists();

            if (!$exists) {
                $businessMaps[] = [
                    'business_type_id' => $businessTypeId,
                    'module_id'        => $module->id,
                    'is_active'        => true,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];
            }
        }

        if (!empty($businessMaps)) {
            DB::table('Ms_business_module_maps')->insert($businessMaps);
        }
    }

    /**
     * Mengisi Permission Owner berdasarkan Ms_business_module_maps
     */
    private function seedOwnerPermissions($tenantId, $roleId, $userId, $businessTypeId)
    {
        $menus = DB::table('Ms_menus as m')
            ->join('Ms_business_module_maps as bmm', 'm.module_id', '=', 'bmm.module_id')
            ->where([
                ['bmm.business_type_id', '=', $businessTypeId],
                ['bmm.is_active', '=', true],
                ['m.is_active', '=', true]
            ])
            ->select('m.id as menu_id', 'm.module_id')
            ->get();

        $permissions = [];
        foreach ($menus as $menu) {
            $permissions[] = [
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
                'created_by' => (string)$userId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($permissions)) {
            DB::table('Ms_role_menu_permissions')->insert($permissions);
        }
    }

    private function seedDefaultPaymentMethods($tenantId, $userId)
    {
        $methods = [
            [
                'tenant_id'  => $tenantId,
                'code'       => 'CASH',
                'name'       => 'Tunai',
                'type'       => 'CASH',
                'is_active'  => true,
                'is_default' => true,
                'created_by' => (string)$userId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id'  => $tenantId,
                'code'       => 'PAY_LATER',
                'name'       => 'Bayar Nanti',
                'type'       => 'DEBT',
                'is_active'  => true,
                'is_default' => false,
                'created_by' => (string)$userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];
        DB::table('Ms_payment_methods')->insert($methods);
    }

    private function generateUsername($email)
    {
        return explode('@', $email)[0] . rand(10, 99);
    }

    private function handleLogError($e, $data)
    {
        $sql = null;
        $bindings = [];
        if ($e instanceof QueryException) {
            $sql = $e->getSql();
            $bindings = $e->getBindings();
        }
        $this->logDbErrorRepo->store([
            'message'    => "Registration Failure: " . $e->getMessage(),
            'sql_query'  => $sql,
            'bindings'   => json_encode($bindings),
            'url'        => Request::fullUrl(),
            'ip_address' => Request::ip(),
        ]);
    }
}
