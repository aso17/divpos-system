<?php

namespace App\Services;
use Illuminate\Support\Facades\Storage;
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

   public function getAllUsers(array $params)
    {
        // 1. Logika Dekripsi Tenant ID
        $tenantId = CryptoHelper::decrypt($params['tenant_id'] ?? null);
        
        if (!$tenantId || !is_numeric($tenantId)) {
            return null;
        }

        // 2. Ambil Base Query (Join: Ms_users + Ms_employees + Ms_roles)
        $query = $this->userRepo->getBaseUserQuery((int)$tenantId);

        // 3. Logika Filter Keyword (Gunakan Alias Tabel agar tidak Ambigus)
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
        // 1. Hash Password
        $data['password'] = Hash::make($data['password']);

        // 2. Default Active
        $data['is_active'] = $data['is_active'] ?? true;

        // 3. Sanitasi Data Dasar
        $data['full_name'] = strip_tags($data['full_name']);
        $data['username'] = strip_tags($data['username'] ?? '');

        // 4. Handle Avatar
        if ($avatarFile) {
            $filename = 'avatar_' . time() . '_' . Str::uuid() . '.' . $avatarFile->getClientOriginalExtension();
            $data['avatar'] = $avatarFile->storeAs('avatars', $filename, 'public');
        }

        return $this->userRepo->create($data);
    }

    public function updateUserInfo(int $id, int $tenantId, array $data, $avatarFile = null)
    {
        $user = $this->userRepo->findByIdAndTenant($id, $tenantId);
        if (!$user) return null;

        // 1. Handle Password Hash
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']); // Jangan update password kalau kosong
        }

        // 2. Handle Avatar Upload
        if ($avatarFile) {
            // Hapus foto lama jika ada
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            // Simpan foto baru
            $filename = 'avatar_' . time() . '_' . Str::uuid() . '.' . $avatarFile->getClientOriginalExtension();
            $data['avatar'] = $avatarFile->storeAs('avatars', $filename, 'public');
        }

        return $this->userRepo->update($user, $data);
    }

    public function deleteUserById(int $id, int $tenantId)
    {
        // 1. Cari data lewat Repo
        $user = $this->userRepo->findByIdAndTenant($id, $tenantId);

        if (!$user) {
            return null; // Atau throw exception khusus
        }

        // 2. Logika Bisnis Tambahan (Contoh: Jangan hapus diri sendiri)

        // if (auth()->id() === $user->id) {
        //     throw new \Exception("Anda tidak diperbolehkan menghapus akun sendiri.");
        // }

        // 3. Eksekusi hapus lewat Repo
        $this->userRepo->delete($user);

        return $user;
    }
}