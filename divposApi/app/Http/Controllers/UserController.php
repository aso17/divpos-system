<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Resources\EmployeeDropdownResource; 
use App\Http\Resources\UserResource;
use App\Services\UserService; 
use App\Http\Requests\UserRequest; 
use App\Helpers\CryptoHelper; 

class UserController extends Controller
{
    protected $userService;
    protected $userRepository;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
       
    }
    
  public function index(Request $request)
    {
       
        $request->validate([
            'keyword'  => 'nullable|string|max:50',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $userAuth = Auth::user();
        $tenantId = $userAuth->tenant_id ?? $userAuth->employee?->tenant_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        // 2. Siapkan Params
        $params = [
            'tenant_id' => $tenantId,
            'keyword'   => $request->query('keyword'),
        ];

        // 3. Panggil Service
        $query = $this->userService->getAllUsers($params);

        if (!$query) {
            return response()->json(['message' => 'Unauthorized Tenant'], 403);
        }

        // 4. Pagination dengan default yang aman
        $perPage = (int) $request->input('per_page', 10);
        $users = $query->paginate($perPage);

        return UserResource::collection($users);
    }

    public function getAvailableEmployees()
    {
       
       try {
        $user = Auth::user();      
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Tenant tidak ditemukan'], 403);
        }

        $employees = $this->userService->getEmployeesForDropdown($tenantId);

        return response()->json([
            'status' => 'success',          
            'data'   => EmployeeDropdownResource::collection($employees)
        ]);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengambil data: ' . $e->getMessage()
            ], 500);
        }
    }

    // POST /user
public function store(UserRequest $request)
{
    try {
      
        $user = $this->userService->createUser(
            $request->validated(), 
            $request->file('avatar')
        );

        $user->load(['role', 'employee']);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dibuat',
            'data' => new UserResource($user), 
        ], 201);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Gagal membuat user: ' . $e->getMessage()
        ], 500);
    }
}

// PUT /user/{id}
public function update(UserRequest $request, $id)
{
    try {
        // Ambil ID asli yang sudah didekripsi di prepareForValidation
        $decryptedId = $request->id;
        
        // Ambil Tenant ID dari user yang sedang login (sebagai filter akses)
        $userAuth = Auth::user();
        $tenantId = $userAuth->tenant_id ?? $userAuth->employee?->tenant_id;

        $user = $this->userService->updateUserInfo(
            (int)$decryptedId, 
            (int)$tenantId, 
            $request->validated(), 
            $request->file('avatar')
        );

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User tidak ditemukan atau tidak ada akses'], 404);
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
