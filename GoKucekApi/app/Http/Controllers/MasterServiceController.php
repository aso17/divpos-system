<?php

namespace App\Http\Controllers;

use App\Services\MasterService;
use App\Models\Ms_package;
use App\Http\Resources\ServiceResource;
use Illuminate\Http\Request;
use App\Helpers\CryptoHelper;

class MasterServiceController extends Controller
{
    protected $masterService;

    public function __construct(MasterService $masterService)
    {
        $this->masterService = $masterService;
    }

    public function index(Request $request)
    {
        $query = $this->masterService->getPaginatedServices($request->all());

        if (!$query) {
            return response()->json(['message' => 'Tenant tidak valid'], 403);
        }

        $perPage = $request->per_page ?? 10;
        $services = $query->paginate($perPage);
        return ServiceResource ::collection($services)->response()->getData(true);
    }

   public function store(Request $request)
    {
       
        if ($request->has('tenant_id')) {
            try {
                $request->merge([
                    'tenant_id'  => (int) CryptoHelper::decrypt($request->tenant_id),
                    'created_by' => CryptoHelper::decrypt($request->created_by),
                ]);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Data identitas tidak valid'], 400);
            }
        }
        // 2. Validasi Input
        $validated = $request->validate([
            'tenant_id'   => 'required|integer|exists:Ms_tenants,id', 
            'name'        => 'required|string|max:100', 
            'description' => 'nullable|string|max:200', 
            'is_active'   => 'boolean',
            'created_by'  => 'required|string|max:50',  
        ]);

        try {
            // 3. Eksekusi melalui Business Logic Layer
            $service = $this->masterService->createService($validated);

            return response()->json([
                'status'  => 'success',
                'message' => 'Layanan berhasil dibuat',
                'data'    => new ServiceResource($service)
            ], 201);

        } catch (\Exception $e) {
           
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function update(Request $request, $id)
    {
        // 1. Pre-Processing: Dekripsi & Normalisasi
        if ($request->has('tenant_id')) {
            try {
                $request->merge([
                    // Decode ID dari URL jika terenkripsi, atau biarkan jika integer
                    'tenant_id'  => (int) CryptoHelper::decrypt($request->tenant_id),
                    'updated_by' => CryptoHelper::decrypt($request->updated_by), // Ambil dari info login React
                ]);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Identitas tenant tidak valid'], 400);
            }
        }

        // 2. Validasi Ketat (Sesuaikan dengan skema tabel Ms_services)
        $validated = $request->validate([
            'tenant_id'   => 'required|integer|exists:Ms_tenants,id',
            'name'        => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:200',
            'is_active'   => 'boolean',
            'updated_by'  => 'required|string|max:50',
        ]);

        try {
           
            $service = $this->masterService->updateService($id, $validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Layanan berhasil diperbarui',
                'data' => new ServiceResource($service)
            ]);
        } catch (\Exception $e) {
            // 422 untuk kegagalan bisnis logic (misal: nama duplikat setelah rename)
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Remove the specified service from storage
     */
  public function destroy(Request $request, $id)
{
    try {
        // 1. Dekripsi ID Layanan dan Tenant ID
        $decryptedId = CryptoHelper::decrypt($id);
        $decryptedTenantId = CryptoHelper::decrypt($request->query('tenant_id'));

        if (!$decryptedId || !$decryptedTenantId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parameter keamanan tidak valid.'
            ], 400);
        }

      
        $hasPackages = Ms_package::where('service_id', $decryptedId)
            ->where('tenant_id', $decryptedTenantId)
            ->exists();

        if ($hasPackages) {
            return response()->json([
                'status' => 'error',
                'message' => 'Layanan tidak bisa dihapus karena masih digunakan dalam Master Paket.'
            ], 422);
        }

        $this->masterService->deleteService((int)$decryptedId, (int)$decryptedTenantId);

        return response()->json([
            'status' => 'success',
            'message' => 'Layanan berhasil dihapus'
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
        ], 500);
    }
}
}