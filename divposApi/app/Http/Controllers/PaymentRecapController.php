<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRecapRequest;
use App\Http\Requests\PaymentRecapExportRequest;
use App\Services\PaymentRecapService;
use App\Services\OutletService;
use App\Services\PaymentMethodService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentRecapController extends Controller
{
    public function __construct(
        private readonly PaymentRecapService  $service,
        private readonly OutletService        $outletService,
        private readonly PaymentMethodService $paymentMethodService,
    ) {
    }

    /**
     * GET /api/reports/payments
     */
    public function index(PaymentRecapRequest $request): JsonResponse
    {
        $user     = Auth::user();
        $tenantId = $user->tenant_id;
        $outletId = $user->outlet_id ?? null;

        $result = $this->service->getPaginated($request->validated());

        $result['outlets']         = $this->outletService->getAllOutletsTransaction($tenantId, $outletId);
        $result['payment_methods'] = $this->paymentMethodService->getAllPaymentMethodsTransaction($tenantId);

        return response()->json($result);
    }

    /**
     * GET /api/reports/payments/export
     */
    public function export(PaymentRecapExportRequest $request): StreamedResponse
    {
        return $this->service->export($request->validated());
    }
}
