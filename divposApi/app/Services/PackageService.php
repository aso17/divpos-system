<?php

namespace App\Services;

use App\Repositories\PackageRepository;
use App\Helpers\CryptoHelper;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Ms_Package;
use App\Repositories\LogDbErrorRepository;


class PackageService
{
    protected $packageRepo, $logRepo;

    public function __construct( PackageRepository $packageRepo,  LogDbErrorRepository $logRepo) {
        $this->packageRepo = $packageRepo;
        $this->logRepo = $logRepo;
    }

   public function getAllPackagesTransaction(int $tenantId)
    {
        // Jika kedepannya Mas mau tambah Cache (misal: Redis), 
        // logic-nya ditaruh di sini agar Repository tetap murni query.
        return $this->packageRepo->getForTransaction($tenantId);
    }

   
   public function getAllPackages(array $params)
    {
        $tenantId = $params['tenant_id'] ?? null;

        // Early return jika tenant_id tidak valid
        if (!$tenantId || !is_numeric($tenantId)) {
            return collect([]); 
        }

        // 1. Ambil Base Query (Pastikan Repo sudah pakai select & with yang kita bahas tadi)
        $query = $this->packageRepo->getBasePackageQuery((int) $tenantId);

        // 2. Gunakan Chain of Responsibility (Clean Code)
        return $query
            // Filter Keyword (Nama atau Kode)
            ->when(!empty($params['keyword']), function ($q) use ($params) {
                $keyword = $params['keyword'];
                $q->where(function ($w) use ($keyword) {
                    $w->where('name', 'ilike', "%{$keyword}%")
                    ->orWhere('code', 'ilike', "%{$keyword}%");
                });
            })

            // Filter Kategori (Dekripsi & Cek Validitas)
            ->when(!empty($params['category_id']), function ($q) use ($params) {
                $catId = CryptoHelper::decrypt($params['category_id']);
                if ($catId) $q->where('category_id', $catId);
            })

            // Filter Layanan (Dekripsi & Cek Validitas)
            ->when(!empty($params['service_id']), function ($q) use ($params) {
                $svcId = CryptoHelper::decrypt($params['service_id']);
                if ($svcId) $q->where('service_id', $svcId);
            })

            // Filter Status Aktif
            ->when(isset($params['is_active']) && $params['is_active'] !== '', function ($q) use ($params) {
                $q->where('is_active', filter_var($params['is_active'], FILTER_VALIDATE_BOOLEAN));
            })

            // 3. Sorting Utama
            ->orderByDesc('id');
    }

   public function createPackage(array $data)
    {
        // Menggunakan Transaction agar data Ms_packages dan Logging tetap sinkron
        return DB::transaction(function () use ($data) {
            try {
                $user = Auth::user();
                $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

                if (!$tenantId) throw new \Exception("Identity Tenant tidak ditemukan.");

                $unit = \App\Models\Ms_unit::findOrFail($data['unit_id']);

                // 2. Generate Kode Otomatis
                $data['code'] = $this->generateUniqueCode($tenantId);

                // 3. Sanitasi & Mapping Data Final
                $payload = [
                    'tenant_id'       => (int) $tenantId,
                    'service_id'      => (int) $data['service_id'],
                    'category_id'     => (int) $data['category_id'],
                    'unit_id'         => (int) $data['unit_id'],
                    'code'            => $data['code'],
                    // Cukup strip_tags & trim agar karakter khusus seperti '&' tidak berubah jadi '&amp;' di DB
                    'name'            => strip_tags(trim($data['name'])), 
                    'description'     => isset($data['description']) ? strip_tags($data['description']) : null,
                    'price'           => abs((float) $data['price']),
                    'discount_type'   => $data['discount_type'] ?? 'none',
                    'discount_value'  => (float) ($data['discount_value'] ?? 0),
                    // Kalkulasi ulang di BE untuk keamanan
                    'final_price'     => $this->calculateFinalPrice($data['price'], $data['discount_type'], $data['discount_value']),
                    'duration_menit'  => (int) ($data['duration_menit'] ?? 0),
                    
                    // AMBIL DARI MASTER UNIT (Sesuai catatan denormalisasi di migrasi Mas)
                    'is_weight_based' => (bool) $unit->is_decimal, 
                    
                    'min_order'       => (float) ($data['min_order'] ?? 1),
                    'is_active'       => filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    // created_by & updated_by otomatis diisi oleh Model Booting
                ];

                return $this->packageRepo->create($payload);

            } catch (\Exception $e) {
                // Log error ke Repo khusus Log
                $this->logRepo->store([
                    'user_id'    => Auth::id(),
                    'tenant_id'  => $tenantId ?? null,
                    'error_code' => $e->getCode() ?: 500,
                    'message'    => "PackageService@createPackage: " . $e->getMessage(),
                    'url'        => request()->fullUrl(),
                    'ip_address' => request()->ip(),
                    'bindings'   => json_encode($data), 
                ]);

                return null; // Controller akan menangani response error 400
            }
        });
    }

    public function updatePackage($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            try {
                $user = Auth::user();
                $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

                // 1. Cari Paket & Pastikan Milik Tenant (Security Double Check)
                $package = $this->packageRepo->findByIdAndTenant((int)$id, (int)$tenantId);
                if (!$package) {
                    throw new \Exception("Paket tidak ditemukan atau Anda tidak memiliki akses.");
                }

                // 2. Jika Unit berubah, update flag is_weight_based
                if (isset($data['unit_id']) && $data['unit_id'] != $package->unit_id) {
                    $unit = \App\Models\Ms_unit::findOrFail($data['unit_id']);
                    $data['is_weight_based'] = (bool) $unit->is_decimal;
                }

                $payload = [
                    'service_id'     => isset($data['service_id']) ? (int) $data['service_id'] : $package->service_id,
                    'category_id'    => isset($data['category_id']) ? (int) $data['category_id'] : $package->category_id,
                    'unit_id'        => isset($data['unit_id']) ? (int) $data['unit_id'] : $package->unit_id,
                    'name'           => isset($data['name']) ? strip_tags(trim($data['name'])) : $package->name,
                    'description'    => isset($data['description']) ? strip_tags($data['description']) : $package->description,
                    'price'          => isset($data['price']) ? abs((float) $data['price']) : $package->price,
                    'discount_type'  => $data['discount_type'] ?? $package->discount_type,
                    'discount_value' => isset($data['discount_value']) ? (float) $data['discount_value'] : $package->discount_value,
                    'final_price'    => $this->calculateFinalPrice(
                                            $data['price'] ?? $package->price, 
                                            $data['discount_type'] ?? $package->discount_type, 
                                            $data['discount_value'] ?? $package->discount_value
                                        ),
                    'duration_menit' => isset($data['duration_menit']) ? (int) $data['duration_menit'] : $package->duration_menit,
                    'is_weight_based'=> $data['is_weight_based'] ?? $package->is_weight_based,
                    'min_order'      => isset($data['min_order']) ? (float) $data['min_order'] : $package->min_order,
                    'is_active'      => isset($data['is_active']) ? filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN) : $package->is_active,
                ];

               
                return $this->packageRepo->update($package, $payload);

            } catch (\Exception $e) {
                
                $this->logRepo->store([
                    'user_id'    => Auth::id(),
                    'tenant_id'  => $tenantId ?? null,
                    'error_code' => $e->getCode() ?: 500,
                    'message'    => "PackageService@updatePackage: " . $e->getMessage(),
                    'url'        => request()->fullUrl(),
                    'ip_address' => request()->ip(),
                    'bindings'   => json_encode(['id' => $id, 'data' => $data]), 
                ]);

                return null;
            }
        });
    }
   
    public function deletePackage($id, $tenantId)
    {
        return DB::transaction(function () use ($id, $tenantId) {
            try {
                $package = $this->packageRepo->findByIdAndTenant((int)$id, (int)$tenantId);

                if (!$package) return null;

                $isUsedInTransaction = DB::table('Tr_transaction_details')
                    ->where('package_id', $id)
                    ->whereNull('deleted_at')
                    ->exists();

                if ($isUsedInTransaction) {
                   
                    throw new \Exception("Paket '{$package->name}' tidak bisa dihapus karena sudah digunakan dalam transaksi. Silakan nonaktifkan saja (is_active = false).");
                    
                }

                // 2. PROSES HAPUS (Soft Delete)
                $this->packageRepo->delete($package);

                return $package;

            } catch (\Exception $e) {
                $this->logRepo->store([
                    'user_id'    => Auth::id(),
                    'tenant_id'  => $tenantId,
                    'error_code' => $e->getCode() ?: 500,
                    'message'    => "PackageService@deletePackage: " . $e->getMessage(),
                    'bindings'   => json_encode(['id' => $id]), 
                ]);

                throw $e; 
            }
        });
    }

      /**
     * Generate Kode Paket Unik per Tenant
     */
    private function generateUniqueCode($tenantId)
    {
        $prefix = "PCK-" . date('ym') . "-";
       
        $lastPackage = $this->packageRepo->getLastPackageByTenant($tenantId);
        
        $number = 1;
        if ($lastPackage) {
            $lastCode = $lastPackage->code;
            $lastNumber = (int) substr($lastCode, -4);
            $number = $lastNumber + 1;
        }

        return $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);
    }

    private function calculateFinalPrice($price, $type, $value)
    {
        if ($type === 'percentage') return $price - ($price * ($value / 100));
        if ($type === 'fixed') return max(0, $price - $value);
        return $price;
    }


}