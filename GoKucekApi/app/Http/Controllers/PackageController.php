<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\PackageResource;
use App\Services\PackageService; 
use App\Helpers\CryptoHelper; 
use Illuminate\Support\Facades\Validator;

class PackageController extends Controller
{
    protected $packageService;
    
    public function __construct(PackageService $packageService)
    {
        $this->packageService = $packageService;
    }


    public function generateCode(Request $request)
    {
        // Cek parameter wajib saja
        if (!$request->service_id || !$request->category_id || !$request->tenant_id) {
            return response()->json(['message' => 'Incomplete parameters'], 422);
        }

        $newCode = $this->packageService->generatePackageCode(
            $request->tenant_id, 
            $request->service_id, 
            $request->category_id
        );

        return response()->json(['code' => $newCode]);
    }
        

    /**
     * Ambil daftar paket dengan filter tenant_id
     */
    public function index(Request $request)
    {
        if (!$request->filled('tenant_id')) {
            return response()->json(['message' => 'tenant_id is required'], 422);
        }

        $query = $this->packageService->getAllPackages($request->all());

        if (!$query) {
            return response()->json(['message' => 'Invalid tenant atau data tidak ditemukan'], 403);
        }

        $perPage = (int) ($request->per_page ?? 10);

        if ($request->filled('page')) {
            $data = $query->paginate($perPage);
            return PackageResource::collection($data); 
        }

        return PackageResource::collection($query->get());
    }

    /**
     * Simpan paket baru
     */
        public function store(Request $request)
            {
                $validator = Validator::make($request->all(), [
                    'tenant_id'   => 'required',
                    'service_id'  => 'required',
                    'category_id' => 'required',
                    'code'        => 'required|string|alpha_dash|max:20|unique:Ms_packages,code', 
                    'name'        => 'required|string|min:3|max:100|regex:/^[a-zA-Z0-9\s\-\(\)]+$/',
                    'price'       => 'required|numeric|min:0',
                    'unit'        => 'required|string|max:10|alpha', 
                    'min_order'   => 'required|numeric|min:0.1',
                    'description' => 'nullable|string|max:255',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errors' => $validator->errors(), 
                        'message' => 'Validasi gagal'
                    ], 422);
                }

                $validatedData = $request->only([
                    'tenant_id', 'service_id', 'category_id', 'code', 
                    'name', 'price', 'unit', 'min_order', 'description', 'is_active', 'created_by' // Tambahkan created_by di sini!
                ]);

                $data = $this->packageService->createPackage($validatedData);

                if (!$data) {
                    return response()->json([
                        'message' => 'Gagal memproses data. Pastikan sesi login dan tenant valid.'
                    ], 400);
                }

                return response()->json([
                    'message' => 'Paket berhasil dibuat',
                    'data'    => new PackageResource($data)
                ], 201);
            }

   
    public function update(Request $request, $id)
    {
        
        $decryptedId = CryptoHelper::decrypt($id);
        if (!$decryptedId) {
            return response()->json(['message' => 'ID Paket tidak valid'], 400);
        }

        $validator = Validator::make($request->all(), [
            'tenant_id'   => 'required',
            'service_id'  => 'required',
            'category_id' => 'required',
            // Validasi Unique: Abaikan ID asli (integer) di database
            'code'        => 'required|string|alpha_dash|max:20|unique:Ms_packages,code,' . $decryptedId, 
            'name'        => 'required|string|min:3|max:100|regex:/^[a-zA-Z0-9\s\-\(\)]+$/',
            'price'       => 'required|numeric|min:0',
            'unit'        => 'required|string|max:10',
            'min_order'   => 'required|numeric|min:0.1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(), 
                'message' => 'Validasi gagal'
            ], 422);
        }

       
        $validatedData = $request->only([
            'tenant_id', 'service_id', 'category_id', 'code', 
            'name', 'price', 'unit', 'min_order', 'description', 
            'is_active', 'updated_by' 
        ]);

        $updated = $this->packageService->updatePackage($decryptedId, $validatedData);

        if (!$updated) {
            return response()->json(['message' => 'Gagal mengupdate paket'], 400);
        }

        return response()->json([
            'message' => 'Paket berhasil diupdate',
            'data'    => new PackageResource($updated)
        ]);
    }

    /**
     * Hapus paket
     */
    public function destroy(Request $request, $id)
    {
        $decryptedId = CryptoHelper::decrypt($id) ?? $id;
        $decryptedTenantId = CryptoHelper::decrypt($request->tenant_id);

        if (!$decryptedTenantId) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $deleted = $this->packageService->deletePackage($decryptedId, $decryptedTenantId);

        if (!$deleted) {
            return response()->json(['message' => 'Data tidak ditemukan atau sudah dihapus'], 404);
        }

        return response()->json(['message' => 'Paket berhasil dihapus']);
    }
}