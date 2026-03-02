<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\OutletResource;
use App\Services\OutletService; 
use App\Helpers\CryptoHelper; 
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB; // Tambahkan ini

class OutletController extends Controller
{
    protected $outletService;
    
    public function __construct(OutletService $outletService)
    {
        $this->outletService = $outletService;
    }
    
    // --- METHOD GENERATECODE DIHAPUS ---

    public function index(Request $request)
    {
       
        $params = $request->all();
        $query = $this->outletService->getAllOutlets($params);

        $perPage = (int) ($request->per_page ?? 10);

        if ($request->filled('page')) {
            $data = $query->paginate($perPage);
            return OutletResource::collection($data); 
        }

        return OutletResource::collection($query->get());
    }

    public function store(Request $request)
    {
        // 1. Validasi Input (Code dihapus dari validasi, dan validasi tipe data lainnya)
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required',
            'name'      => 'required|string|min:3',
            'phone'     => 'nullable|string',
            'city'      => 'required|string',
            'address'   => 'required|min:10',
            'is_active' => 'boolean',
            'is_main_branch' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validasi gagal'], 422);
        }

        try {

            DB::beginTransaction();

           $payload = $request->only([
            'tenant_id', 
            'name', 
            'phone', 
            'city', 
            'address', 
            'is_active', 
            'is_main_branch',
            'created_by'
            ]);     
           
            $data = $this->outletService->createOutlet($payload);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Outlet berhasil dibuat',
                'data'    => new OutletResource($data)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat outlet: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required',
            'name'      => 'required|string|min:3',
            'phone'     => 'nullable|string',
            'city'      => 'required|string',
            'address'   => 'required|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validasi gagal'], 422);
        }

        try {
            
            DB::beginTransaction();
            $payload = $request->only([
                'tenant_id', 
                'name', 
                'phone', 
                'city', 
                'address', 
                'is_active', 
                'is_main_branch',
                'updated_by'
            ]);  
            $updated = $this->outletService->updateOutlet($id, $payload);

            if (!$updated) {
                throw new \Exception("Outlet tidak ditemukan.");
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Outlet berhasil diupdate',
                'data'    => new OutletResource($updated)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $decryptedId = CryptoHelper::decrypt($id);
            $decryptedTenantId = CryptoHelper::decrypt($request->query('tenant_id')); // Gunakan query

            if (!$decryptedId || !$decryptedTenantId) {
                throw new \Exception("Parameter tidak valid.");
            }

            $deleted = $this->outletService->deleteOutlet($decryptedId, $decryptedTenantId);

            if (!$deleted) {
                throw new \Exception("Data tidak ditemukan.");
            }

            return response()->json([
                'success' => true,
                'message' => 'Outlet berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}