<?php

namespace App\Services;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Ms_employee;
use App\Models\Ms_user;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Repositories\UserRepository;
use App\Helpers\CryptoHelper;

class UserService
{
    protected $userRepo;

    public function __construct(UserRepository $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    public function getEmployeesForDropdown($tenantId)
    {
        return $this->userRepo->findAvailableEmployees($tenantId);
    }
   public function getAllUsers(array $params)
    {
        // 1. Logika Dekripsi Tenant ID
        $tenantId = $params['tenant_id'];
        
        if (!$tenantId || !is_numeric($tenantId)) {
            return null;
        }

        $query = $this->userRepo->getBaseUserQuery((int)$tenantId);

        if (!empty($params['keyword'])) {
            $q = $params['keyword'];
            $query->where(function ($w) use ($q) {
                // Pakai ILIKE untuk PostgreSQL agar case-insensitive
                $w->where('Ms_employees.full_name', 'ILIKE', "%{$q}%")
                ->orWhere('Ms_users.email', 'ILIKE', "%{$q}%")
                ->orWhere('Ms_users.username', 'ILIKE', "%{$q}%")
                ->orWhere('Ms_employees.phone', 'LIKE', "%{$q}%");
            });
        }

        // 4. Logika Filter Role (Jika ada filter role dari UI)
        if (!empty($params['role_id'])) {
            $roleId = CryptoHelper::decrypt($params['role_id']);
            if ($roleId && is_numeric($roleId)) {
                // Spesifik merujuk ke kolom role_id di tabel users
                $query->where('Ms_users.role_id', $roleId);
            }
        }

        // 5. Sorting (Terbaru di atas)
        return $query->orderByDesc('Ms_users.created_at');
    }

    public function createUser(array $data, $avatarFile = null)
    {
        return DB::transaction(function () use ($data, $avatarFile) {
            
            // 1. Logika Tenant
            if (!empty($data['employee_id'])) {
                $data['tenant_id'] = null;
            } else {
                $userAuth = Auth::user();
                $data['tenant_id'] = $userAuth->tenant_id ?? $userAuth->employee?->tenant_id;
            }

            // 2. Hash Password & Status
            $data['password'] = Hash::make($data['password']);
            $data['is_active'] = $data['is_active'] ?? true;

            // 3. Handle Avatar
            if ($avatarFile) {
                $filename = 'avatar_' . time() . '_' . Str::uuid() . '.' . $avatarFile->getClientOriginalExtension();
                $data['avatar'] = $avatarFile->storeAs('imgAvatars', $filename, 'public');
            }

           
            $user = $this->userRepo->create($data);

            if (!empty($data['employee_id'])) {
                Ms_employee::where('id', $data['employee_id'])
                    ->update(['user_id' => $user->id]);
            }

            return $user;
        });
    }

    public function updateUserInfo(int $id,  array $data, $avatarFile = null)
    {
        // 1. Cari user berdasarkan ID
        $user = $this->userRepo->findById($id); 
        if (!$user) return null;

        // --- PROTEKSI WEWENANG ---
        $authUser = Auth::user();
        
        // Menggunakan Accessor is_owner yang sudah kita buat di model Ms_user
        $isOwner = $authUser->is_owner; 
        $isEditingSelf = $authUser->id === $user->id;

        // Jika BUKAN Owner ATAU sedang mengedit diri sendiri, 
        // paksa hapus data role, status aktif, dan tenant agar tidak berubah.
        if (!$isOwner || $isEditingSelf) {
            unset($data['role_id'], $data['is_active'], $data['tenant_id']);
        }
        // -------------------------

        // 2. Handle Password Hash
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
           
            unset($data['password']);
        }

        // 3. Handle Avatar Upload & Delete Old
        if ($avatarFile) {
            // Hapus file lama jika ada
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            
            $filename = 'avatar_' . time() . '_' . \Illuminate\Support\Str::uuid() . '.' . $avatarFile->getClientOriginalExtension();
            $data['avatar'] = $avatarFile->storeAs('imgAvatars', $filename, 'public');
        }

        // 4. Eksekusi update melalui Repository
        // Kolom 'updated_by' akan otomatis terisi berkat fungsi booted() di model
        return $this->userRepo->update($user, $data);
    }


    public function revokeUserAccess($userId, $tenantId)
    {
        return DB::transaction(function () use ($userId, $tenantId) {
            // 1. Cari user yang sah di tenant tersebut
            $user = Ms_user::where('id', $userId)
                ->whereHas('employee', function($q) use ($tenantId) {
                    $q->where('tenant_id', $tenantId);
                })->firstOrFail();

           
            if ($user->is_owner) {
                throw new \Exception("Akun Owner tidak dapat dihapus melalui jalur ini.");
            }
            if (Auth::user()->id == $user->id) {
                throw new \Exception("Anda tidak bisa menghapus akun Anda sendiri.");
            }

            Ms_employee::where('user_id', $user->id)->update(['user_id' => null]);
            $user->delete();

            return $user;
        });
    }
   
   
}