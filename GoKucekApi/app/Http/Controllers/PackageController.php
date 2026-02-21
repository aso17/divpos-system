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

    /**
     * Ambil daftar paket dengan filter tenant_id
     */
    public function index(Request $request)
    {
        if (!$request->filled('tenant_id')) {
            return response()->json(['message' => 'tenant_id is required'], 422);
        }

        // Service harus menangani dekripsi tenant_id di dalamnya 
        // atau kita kirim hasil dekripsi ke service
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
            'code'        => 'required|string|unique:Ms_packages,code', // Sesuaikan nama tabel
            'name'        => 'required|string|min:3',
            'price'       => 'required|numeric|min:0',
            'unit'        => 'required|string',
            'min_order'   => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(), 
                'message' => 'Validasi gagal'
            ], 422);
        }

        $data = $this->packageService->createPackage($request->all());

        return response()->json([
            'message' => 'Paket berhasil dibuat',
            'data'    => new PackageResource($data)
        ], 201);
    }

    /**
     * Update data paket
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tenant_id'   => 'required',
            'service_id'  => 'required',
            'category_id' => 'required',
            'name'        => 'required|string|min:3',
            'price'       => 'required|numeric|min:0',
            'unit'        => 'required|string',
            'min_order'   => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(), 
                'message' => 'Validasi gagal'
            ], 422);
        }

        $updated = $this->packageService->updatePackage($id, $request->all());

        if (!$updated) {
            return response()->json(['message' => 'Gagal mengupdate paket atau data tidak ditemukan'], 404);
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