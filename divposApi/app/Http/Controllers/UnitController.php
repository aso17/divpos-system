<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Http\Resources\UnitResource;
use App\Services\UnitService;
use App\Services\LogDbErrorService;

class UnitController extends Controller
{
    protected $unitService;
    protected $logService;

    public function __construct(UnitService $unitService, LogDbErrorService $logService)
    {
        $this->unitService = $unitService;
        $this->logService = $logService;
    }

    public function index()
    {
        try {

            $user = Auth::user();
            $tenantId = $user->employee->tenant_id ?? null;

            if (!$tenantId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized: Tenant not found.'
                ], 403);
            }

            $units = $this->unitService->getUnitAll($tenantId);

            return UnitResource::collection($units);

        } catch (\Exception $e) {

            $this->logService->log($e, [
                'user_id' => Auth::id(),
                'action' => 'fetch_units'
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data satuan.'.$e->getMessage()
            ], 500);
        }
    }
}
