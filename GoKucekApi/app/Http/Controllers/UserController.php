<?php

namespace App\Http\Controllers;

use App\Models\Ms_user;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Http\Resources\UserResource;
use App\Services\UserService; 
use App\Helpers\CryptoHelper; 

class UserController extends Controller
{
    protected $userService;
    protected $userRepository;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
       
    }
    
    // GET /user
    public function index(Request $request)
    {
        if (!$request->filled('tenant_id')) {
            return response()->json(['message' => 'tenant_id is required'], 422);
        }

        $query = $this->userService->getAllUsers($request->all());

        if (!$query) {
            return response()->json(['message' => 'Invalid tenant'], 403);
        }

        $perPage = (int) ($request->per_page ?? 10);

        if ($request->filled('page')) {
            $users = $query->paginate($perPage);
            return UserResource::collection($users); 
        }

        return UserResource::collection($query->get());
    }


    // GET /user/{id}
    public function show($id)
    {
        return Ms_user::with([
            'role:id,role_name,code',
            'tenant:id,slug,code'
        ])->findOrFail($id);
    }

    // POST /user
    public function store(Request $request)
    {
        try {
            
            $decryptedTenantId = CryptoHelper::decrypt($request->tenant_id);

            if (!$decryptedTenantId) {
                throw new \Exception("Tenant ID tidak valid.");
            }
            $request->merge([
                'role_id' => $request->role_id,
                'tenant_id' => $decryptedTenantId,
            ]);

            // 2. Validasi
            $request->validate([
                'full_name' => 'required|string|max:100',
                'email'     => 'required|email|unique:Ms_users,email',
                'username'  => 'nullable|string|max:50|unique:Ms_users,username',
                'password'  => 'required|min:8',
                'role_id'   => 'required|exists:Ms_roles,id',
                'tenant_id' => 'required|exists:Ms_tenants,id',
                'avatar'    => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            ]);

            // 3. Panggil Service
            $user = $this->userService->createUser(
                $request->all(), 
                $request->file('avatar')
            );

            return response()->json([
                'success' => true,
                'message' => 'User berhasil dibuat',
                'datauser' => $user, 
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat user: ' . $e->getMessage()
            ], 500);
        }
    }

    // PUT /user/{id}

    public function update(Request $r, $id)
    {
        try {
            // 1. Dekripsi ID (untuk keperluan query dan validasi unique)
            $decryptedId = CryptoHelper::decrypt($id);
            $decryptedTenantId = CryptoHelper::decrypt($r->header('X-Tenant-Id') ?? $r->tenant_id);

            if (!$decryptedId) throw new \Exception("ID tidak valid.");

            // 2. Validasi (Gunakan ID asli untuk rule unique)
            $r->validate([
                'full_name' => 'required|string|max:100',
                'email'     => "required|email|unique:Ms_users,email,$decryptedId",
                'username'  => "nullable|unique:Ms_users,username,$decryptedId",
                'role_id'   => 'nullable|exists:Ms_roles,id',
                'avatar'    => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            ]);

            // 3. Siapkan data untuk Service
            $data = $r->only(['full_name', 'email', 'username', 'phone', 'role_id', 'is_active', 'password']);
            $avatar = $r->file('avatar');

            // 4. Jalankan Service
            $user = $this->userService->updateUserInfo(
                (int)$decryptedId, 
                (int)$decryptedTenantId, 
                $data, 
                $avatar
            );

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'User tidak ditemukan'], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'User berhasil diupdate',
                'datauser' => $user, 
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Update gagal: ' . $e->getMessage()], 500);
        }
    }

    // DELETE /user/{id}
    public function destroy(Request $request, $id)
    {
        try {
            // 1. Dekripsi (Urusan HTTP/Transport)
            $decryptedId = CryptoHelper::decrypt($id);
            $decryptedTenantId = CryptoHelper::decrypt($request->query('tenant_id'));

            if (!$decryptedId || !$decryptedTenantId) {
                return response()->json(['status' => 'error', 'message' => 'Parameter tidak valid'], 400);
            }

            // 2. Panggil Service (Urusan Logika Bisnis)
            $user = $this->userService->deleteUserById((int)$decryptedId, (int)$decryptedTenantId);

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User tidak ditemukan atau akses ditolak'
                ], 404);
            }

            // 3. Respon ke Client
            return response()->json([
                'status' => 'success',
                'message' => 'User ' . $user->full_name . ' berhasil dihapus',
                'data' => ['id' => $id]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
