<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\OutletResource;
use App\Services\OutletService;
use App\Services\LogDbErrorService;
use App\Helpers\CryptoHelper;
use App\Http\Requests\OutletRequest;
use App\Helpers\ClearCache;

class OutletController extends Controller
{
    protected $outletService;
    protected $logService;

    public function __construct(OutletService $outletService, LogDbErrorService $logService)
    {
        $this->outletService = $outletService;
        $this->logService = $logService;
    }
    public function index(Request $request)
    {

        $user = Auth::user();
        $tenantId = $user->employee->tenant_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized: Tenant not found.'], 403);
        }

        $params = array_merge($request->all(), [
            'tenant_id' => $tenantId
        ]);

        $query = $this->outletService->getAllOutlets($params);
        $perPage = (int) $request->get('per_page', 10);
        if ($perPage > 100) {
            $perPage = 100;
        }
        if ($request->filled('page') || $request->has('per_page')) {
            $data = $query->paginate($perPage)->withQueryString();
            return OutletResource::collection($data);
        }
        return OutletResource::collection($query->limit(50)->get());
    }

    public function store(OutletRequest $request)
    {
        try {

            $user = Auth::user();
            $tenantId = $user->tenant_id ?? $user->employee->tenant_id;

            $payload = $request->validated();
            $payload['tenant_id'] = (int)$tenantId;

            $outlet = $this->outletService->createOutlet($payload);

            ClearCache::tenantTransaction((int)$tenantId);

            return response()->json([
                'success' => true,
                'message' => 'Outlet berhasil dibuat',
                'data'    => new OutletResource($outlet)
            ], 201);

        } catch (\Exception $e) {

            $this->logService->log($e);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat outlet: ' . $e->getMessage()
            ], 500);
        }
    }


    public function update(OutletRequest $request)
    {
        try {
            $user = Auth::user();
            $tenantId = $user->tenant_id ?? $user->employee->tenant_id;
            $decryptedId = $request->id;
            $payload = $request->validated();
            $payload['tenant_id'] = (int)$tenantId;
            $outlet = $this->outletService->updateOutlet($decryptedId, $payload);

            ClearCache::tenantTransaction((int)$tenantId);
            return response()->json([
                'success' => $decryptedId,
                'message' => 'Outlet berhasil diperbarui.',
                'data'    => new OutletResource($outlet)
            ], 200);

        } catch (\Exception $e) {


            $this->logService->log($e);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Terjadi kesalahan sistem saat memperbarui data.'
            ], 500);
        }
    }
    public function destroy($id)
    {
        try {

            $user = Auth::user();
            $tenantId = $user->employee?->tenant_id;

            if (!$tenantId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak: Profil Anda tidak terhubung ke bisnis manapun.'
                ], 403);
            }

            $decryptedId = CryptoHelper::decrypt($id);

            if (!$decryptedId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter ID tidak valid.'
                ], 400);
            }

            $deleted = $this->outletService->deleteOutlet($decryptedId, $tenantId);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak ditemukan atau Anda tidak memiliki otoritas menghapus data ini.'
                ], 404);
            }

            ClearCache::tenantTransaction((int)$tenantId);

            return response()->json([
                'success' => true,
                'message' => 'Outlet berhasil dihapus'
            ], 200);

        } catch (\Exception $e) {

            $this->logService->log($e);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus outlet. Terjadi kesalahan pada server.'
            ], 500);
        }
    }
}
