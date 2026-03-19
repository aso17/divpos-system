<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * DashboardController
 *
 * Tanggung jawab: HTTP LAYER ONLY.
 * 1. Validasi input request
 * 2. Resolve tenant
 * 3. Delegate ke DashboardService
 * 4. Bungkus hasil dengan DashboardResource
 * 5. Return response
 *
 * Alur: Controller → Service → Repository → DB
 *                ↘ Resource (format output)
 */
class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $service
    ) {}

    /**
     * GET /api/dashboard?period=Minggu+Ini
     */
    public function index(Request $request): JsonResponse
    {
        // ── 1. Validasi ───────────────────────────────────────────────────────
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

        // ── 2. Ambil data via Service (satu panggilan) ────────────────────────
        $data = $this->service->buildDashboard($tenantId, $period);

        // ── 3. Format & return ────────────────────────────────────────────────
        return (new DashboardResource($data, $this->service))
            ->response()
            ->setStatusCode(200);
    }

  
}