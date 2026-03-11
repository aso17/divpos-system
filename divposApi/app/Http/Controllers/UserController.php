<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Resources\EmployeeDropdownResource; 
use App\Http\Resources\UserResource;
use App\Services\LogDbErrorService;
use App\Services\UserService; 
use App\Http\Requests\UserRequest; 
use App\Helpers\CryptoHelper; 

class UserController extends Controller
{
    protected $userService;
    protected $userRepository;
    protected $logService;


    public function __construct(UserService $userService,LogDbErrorService $logService)
    {
        $this->userService = $userService;
        $this->logService = $logService;
       
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
            $this->logService->log($e);
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

        $this->logService->log($e);

        return response()->json([
            'status' => 'error',
            'message' => 'Gagal membuat user: ' . $e->getMessage()
        ], 500);
    }
}

// PUT /user/{id}
    public function update(UserRequest $request)
    {
        try {
            // ID sudah didekripsi di UserRequest (prepareForValidation)
            $decryptedId = $request->id;                 
            // Eksekusi Service
            $user = $this->userService->updateUserInfo(
                (int)$decryptedId,       
                $request->validated(), 
                $request->file('avatar')
            );

            if (!$user) {
                return response()->json([
                    'status' => 'error', 
                    'message' => 'User tidak ditemukan atau Anda tidak memiliki akses'
                ], 404);
            }

            // Load relasi untuk response yang lengkap
            $user->load(['role', 'employee.tenant', 'employee.outlet']);
            
            return response()->json([
                'success' => true,
                'message' => 'User berhasil diperbarui',
                'data'    => new UserResource($user),
            ]);

        } catch (\Exception $e) {
            // Log error jika diperlukan: Log::error($e->getMessage());
             $this->logService->log($e);
            return response()->json([
                'status'  => 'error',
                'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
            ], 500);
        }
    }
   
    public function destroy($id)
    {
        try {         
            $decryptedId = CryptoHelper::decrypt($id);
            $user = Auth::user();      
            $tenantId =$user->employee?->tenant_id;

            if (!$decryptedId ) {
                return response()->json(['status' => 'error', 'message' => 'Parameter tidak valid'], 400);
            }

            $result = $this->userService->revokeUserAccess((int)$decryptedId,$tenantId);

            if (!$result) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User tidak ditemukan atau akses ditolak'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'User ' . $result->username . ' berhasil dihapus',
                
            ], 200);

        } catch (\Exception $e) {
             $this->logService->log($e);
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
