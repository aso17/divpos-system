<?php

namespace App\Http\Controllers;

use App\Services\MasterService;
use App\Http\Resources\MasterServiceResource;
use Illuminate\Http\Request;
use App\Http\Requests\MasterServiceRequest;
use App\Services\LogDbErrorService;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper;
use App\Helpers\ClearCache;

class MasterServiceController extends Controller
{
    protected $masterService;
    protected $logService;

    public function __construct(MasterService $masterService, LogDbErrorService $logService)
    {
        $this->masterService = $masterService;
        $this->logService = $logService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

        if (!$tenantId) {
            return response()->json([
                'message' => 'Access denied. You do not have permission to perform this action.'
            ], 403);
        }

        $params = [
            'tenant_id' => $tenantId,
            'keyword' => $request->query('keyword'),
        ];

        $query = $this->masterService->getPaginatedServices($params);

        if (!$query) {
            return response()->json(['message' => 'Tenant tidak valid'], 403);
        }

        $perPage = $request->per_page ?? 10;
        $services = $query->paginate($perPage);
        return MasterServiceResource::collection($services)->response()->getData(true);
    }

    public function store(MasterServiceRequest $request)
    {
        try {

            $validated = $request->validated();
            $service = $this->masterService->createMasterService($validated);
            $user = Auth::user();
            $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;
            ClearCache::tenantTransaction((int)$tenantId);
            return response()->json([
                'status'  => 'success',
                'message' => 'Layanan ' . $service->name . ' berhasil dibuat',
                'data'    => new MasterServiceResource($service)
            ], 201);

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function update(MasterServiceRequest $request)
    {
        try {

            $payload = $request->validated();
            $service = $this->masterService->updateMasterService((int)$payload['id'], $payload);
            $user = Auth::user();
            $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;
            ClearCache::tenantTransaction((int)$tenantId);
            return response()->json([
                'status'  => 'success',
                'message' => 'Layanan berhasil diperbarui',
                'data'    => new MasterServiceResource($service)
            ]);

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function destroy($id)
    {
        try {
            $decryptedId = CryptoHelper::decrypt($id);
            $user = Auth::user();
            $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

            if (!$decryptedId || !$tenantId) {
                return response()->json(['status' => 'error', 'message' => 'Parameter tidak valid.'], 400);
            }

            $this->masterService->deleteMasterService((int)$decryptedId, (int)$tenantId);
            ClearCache::tenantTransaction((int)$tenantId);
            return response()->json([
                'status'  => 'success',
                'message' => 'Layanan berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
