<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\OutletResource;
use App\Services\OutletService; 
use App\Helpers\CryptoHelper; 
use Illuminate\Support\Facades\Validator;

class OutletController extends Controller
{
    protected $outletService;
   
    public function __construct(OutletService $outletService)
    {
        $this->outletService = $outletService;
    }
    
    public function generatecode(Request $request)
    {
        if (!$request->filled('tenant_id')) {
            return response()->json(['message' => 'tenant_id is required'], 422);
        }

        $decryptedTenantId = CryptoHelper::decrypt($request->tenant_id);

        if (!$decryptedTenantId) {
            return response()->json(['message' => 'Invalid tenant_id'], 403);
        }

        $code = $this->outletService->generateOutletCode($decryptedTenantId);

        return response()->json(['code' => $code]);
    }

    public function index(Request $request)
    {
        if (!$request->filled('tenant_id')) {
            return response()->json(['message' => 'tenant_id is required'], 422);
        }

        $query = $this->outletService->getAllOutlets($request->all());

        if (!$query) {
            return response()->json(['message' => 'Invalid tenant'], 403);
        }

        $perPage = (int) ($request->per_page ?? 10);

        if ($request->filled('page')) {
            $data = $query->paginate($perPage);
            return OutletResource::collection($data); 
        }

        return OutletResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required',
            'name'      => 'required|string|min:3',
            'code'      => 'required|string|unique:Ms_outlets,code',
            'phone'     => 'required',
            'city'      => 'required',
            'address'   => 'required|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validasi gagal'], 422);
        }

        $data = $this->outletService->createOutlet($request->all());

        return response()->json([
            'message' => 'Outlet berhasil dibuat',
            'data'    => new OutletResource($data)
        ], 201);
    }

    public function update(Request $request, $id)
    {
        // Karena frontend kirim encrypted ID atau ID mentah, pastikan service bisa handle
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required',
            'name'      => 'required|string|min:3',
            'phone'     => 'required',
            'city'      => 'required',
            'address'   => 'required|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validasi gagal'], 422);
        }

        $updated = $this->outletService->updateOutlet($id, $request->all());

        if (!$updated) {
            return response()->json(['message' => 'Gagal mengupdate outlet atau data tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Outlet berhasil diupdate',
            'data'    => new OutletResource($updated)
        ]);
    }

    public function destroy(Request $request, $id)
    {
        
        $decryptedId = CryptoHelper::decrypt($id) ?? $id;
        $decryptedTenantId = CryptoHelper::decrypt($request->tenant_id);

        if (!$decryptedTenantId) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $deleted = $this->outletService->deleteOutlet($decryptedId, $decryptedTenantId);

        if (!$deleted) {
            return response()->json(['message' => 'Data tidak ditemukan atau sudah dihapus'], 404);
        }

        return response()->json(['message' => 'Outlet berhasil dihapus']);
    }
}