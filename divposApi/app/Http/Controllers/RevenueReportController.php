<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\RevenueExportRequest;
use App\Http\Requests\RevenueReportRequest;
use App\Services\RevenueReportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RevenueReportController extends Controller
{
    public function __construct(
        private readonly RevenueReportService $service
    ) {
    }

    public function index(RevenueReportRequest $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $filters  = $request->validated();

        // Panggil service yang sudah meng-include master data
        $result = $this->service->getReportRevenue($tenantId, $filters);

        return response()->json([
            'status'          => 'success',
            'summary'         => $result['summary'],
            'transactions'    => $result['transactions'],
            'outlets'         => $result['outlets'],         // Dropdown outlet
            // 'payment_methods' => $result['payment_methods'], // Dropdown payment
        ]);
    }
    /* -----------------------------------------------------------------------
     | GET /api/reports/revenue/export
     | Mengembalikan file Excel / CSV sebagai download
     * --------------------------------------------------------------------- */
    // public function export(RevenueExportRequest $request): BinaryFileResponse
    // {
    //     $tenantId = $request->user()->tenant_id;
    //     $filters  = $request->validated();
    //     $format   = $filters['format'] ?? 'xlsx';

    //     return $this->service->export($tenantId, $filters, $format);
    // }
}
