<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\PackageResource;
use App\Http\Requests\PackageRequest;
use App\Services\PackageService; 
use App\Helpers\CryptoHelper; 
use Illuminate\Support\Facades\Auth;

class PackageController extends Controller
{
    protected $packageService;
    
    public function __construct(PackageService $packageService)
    {
        $this->packageService = $packageService;
    }

    public function index(Request $request)
    {
        
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

        if (!$tenantId) {
            return response()->json([
                'message' => 'Access denied. Profil bisnis tidak ditemukan.'
            ], 403);
        }

        
        $params = [
            'tenant_id' => (int) $tenantId,
            'keyword'   => $request->query('keyword'),
        ];

        
        $query = $this->packageService->getAllPackages($params);
        $perPage = $request->integer('per_page', 10);
        $packages = $query->paginate($perPage);

        return PackageResource::collection($packages)->additional([
            'status'  => 'success',
            'message' => 'Data paket berhasil dimuat.'
        ]);
    }
      
    public function store(PackageRequest $request) 
    {
        
        $data = $this->packageService->createPackage($request->validated());

        if (!$data) {
            return response()->json([
                'message' => 'Gagal memproses data paket. Silakan cek log sistem.'
            ], 400);
        }

        return response()->json([
            'message' => 'Paket berhasil dibuat',
            'data'    => new PackageResource($data)
        ], 201);
    }

   public function update(PackageRequest $request)
    {
        
        $validatedData = $request->validated();   
        $payload = array_merge($validatedData, [      
            'final_price' => $request->final_price, 
        ]);

        $updated = $this->packageService->updatePackage($request->id, $payload);

        if (!$updated) {
            return response()->json([
                'message' => 'Gagal mengupdate paket. Data tidak ditemukan atau tidak ada perubahan.'
            ], 400);
        }

        return response()->json([
            'message' => 'Paket berhasil diupdate',
            'data'    => new PackageResource($updated)
        ]);
    }
    public function destroy($id)
    {
         $user = Auth::user();
         $tenantId = $user->tenant_id ?? $user->employee->tenant_id;

        if (!$tenantId) {
            return response()->json([
                'message' => 'Access denied. You do not have permission to perform this action.'
            ], 403);
            }

        $decryptedId = CryptoHelper::decrypt($id) ?? $id;
      
        $deleted = $this->packageService->deletePackage($decryptedId, $tenantId);

        if (!$deleted) {
            return response()->json(['message' => 'Data tidak ditemukan atau sudah dihapus'], 404);
        }

        return response()->json(['message' => 'Paket berhasil dihapus']);
    }
}