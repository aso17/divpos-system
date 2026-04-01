<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $service
    ) {
    }


    public function index(Request $request): JsonResponse
    {

        $validated = $request->validate([
            'period' => ['nullable', 'string', 'in:Hari Ini,Minggu Ini,Bulan Ini'],
        ]);

        $period   = $validated['period'] ?? 'Minggu Ini';
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee->tenant_id;
        if (!$tenantId) {
            return response()->json([
                'message' => 'Access denied. You do not have permission to perform this action.'
            ], 403);
        }

        $data = $this->service->buildDashboard($tenantId, $period);

        return (new DashboardResource($data, $this->service))
            ->response()
            ->setStatusCode(200);
    }


}
