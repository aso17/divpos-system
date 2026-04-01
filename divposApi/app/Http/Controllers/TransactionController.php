<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransactionRequest;
use App\Http\Requests\PaymentUpdateRequest;
use App\Http\Requests\CancelTransactionRequest;
use Illuminate\Support\Facades\Cache;
use App\Services\PackageService;
use App\Services\CustomerService;
use App\Services\OutletService;
use App\Services\EmployeeService;
use App\Services\TransactionService;
use App\Services\PaymentMethodService;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\TransactionHistoryResource;
use App\Http\Resources\TransactionPaymentMethodResource;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\TransactionPackageResource;
use App\Http\Resources\TransactionOutletResource;
use App\Http\Resources\TransactionEmployeeResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    protected $packageService;
    protected $customerService;
    protected $transactionService;
    protected $outletService;
    protected $paymentMethodService;
    protected $employeeService;

    public function __construct(
        PackageService $packageService,
        CustomerService $customerService,
        OutletService $outletService,
        PaymentMethodService $paymentMethodService,
        TransactionService $transactionService,
        EmployeeService $employeeService
    ) {
        $this->packageService = $packageService;
        $this->customerService = $customerService;
        $this->outletService = $outletService;
        $this->paymentMethodService = $paymentMethodService;
        $this->transactionService = $transactionService;
        $this->employeeService = $employeeService;

    }


    public function getInitData()
    {
        $user = Auth::user();
        // Ambil tenantId & outletId dengan fallback yang aman
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;
        $outletId = $user->employee?->outlet_id ?? null; // NULL jika Owner

        if (!$tenantId) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        /**
         * Suffix Cache Key:
         * Agar data 'outlets' tidak tertukar antara Owner (global) dan Kasir (spesifik).
         */
        $suffix = $outletId ? "outlet_{$outletId}" : "owner_global";
        $cacheKey = "init_data_tenant_{$tenantId}_{$suffix}";

        // 1. Ambil data dari cache
        $data = Cache::remember($cacheKey, now()->addHours(24), function () use ($tenantId, $outletId) {
            return [
                'packages'        => $this->packageService->getAllPackagesTransaction($tenantId),
                'outlets'         => $this->outletService->getAllOutletsTransaction($tenantId, $outletId),
                'payment_methods' => $this->paymentMethodService->getAllPaymentMethodsTransaction($tenantId),
            ];
        });

        /**
         * 2. VALIDASI CACHE & FALLBACK
         * Jika cache korup atau key tidak lengkap, ambil data fresh
         */
        if (empty($data['packages']) || empty($data['outlets']) || empty($data['payment_methods'])) {
            Cache::forget($cacheKey);

            $data = [
                'packages'        => $this->packageService->getAllPackagesTransaction($tenantId),
                'outlets'         => $this->outletService->getAllOutletsTransaction($tenantId, $outletId),
                'payment_methods' => $this->paymentMethodService->getAllPaymentMethodsTransaction($tenantId),
            ];
        }

        // 3. Return response dengan Resource Collection
        return response()->json([
            'status' => 'success',
            'data' => [
                'packages'        => TransactionPackageResource::collection($data['packages']),
                'outlets'         => TransactionOutletResource::collection($data['outlets']),
                'payment_methods' => TransactionPaymentMethodResource::collection($data['payment_methods']),
            ]
        ]);
    }

    public function searchEmployeTransaction(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;


        $outletId = $request->query('outlet_id');

        if (!$tenantId) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $params = [
            'tenant_id' => $tenantId,
            'outlet_id' => $outletId,
            'keyword'   => $request->query('q'), // 🔥 Kita gunakan 'q' agar standar search
        ];

        $employees = $this->employeeService->SearchActiveEmployeesByTenant($params);

        return response()->json([
            'status' => 'success',
            // 'm' => $params,
            'data'   => TransactionEmployeeResource::collection($employees)
        ]);
    }
    public function getPaymentMethods()
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

        if (!$tenantId) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        // Gunakan Cache Remember
        $cacheKey = "init_data_tenant_transaction_{$tenantId}";
        $data = Cache::remember($cacheKey, now()->addHours(24), function () use ($tenantId) {
            return [
                'payment_methods' => $this->paymentMethodService->getAllPaymentMethodsTransaction($tenantId),

            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'payment_methods' => TransactionPaymentMethodResource::collection($data['payment_methods']),

            ]
        ]);
    }

    public function getTransactionHistory(Request $request)
    {
        try {

            $data = $this->transactionService->getTransactionHistory($request->all());
            $data->getCollection()->loadMissing(['details']);
            $resource = TransactionHistoryResource::collection($data)->response()->getData(true);

            return response()->json([
                'success' => true,
                'message' => "Riwayat transaksi berhasil diambil",
                'data'    => $resource,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal mengambil data: " . $e->getMessage(),
            ], 500);
        }
    }



    public function getCustomers(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;

        if (!$tenantId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Access denied. Profil bisnis tidak ditemukan.'
            ], 403);
        }

        $customer = $this->customerService->getCustomerTransaction(
            $tenantId,
            $request->query('phone')
        );


        if (!$customer) {
            return response()->json([
                'status' => 'success',
                'data'   => null
            ]);
        }


        return new CustomerResource($customer);
    }

    public function store(TransactionRequest $request)
    {
        try {

            $payload = $request->validated();
            $transaction = $this->transactionService->createTransaction($payload);
            return response()->json([
                'status' => 'success',
                // 'datapay' => $payload,
                'message' => 'Transaksi Berhasil',
                'data' => new TransactionResource(
                    $transaction->load(['details', 'customer', 'outlet', 'initialPaymentMethod'])
                )
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {

            $code = ($e->getCode() < 400 || $e->getCode() > 599) ? 422 : $e->getCode();

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], $code);
        }
    }


    public function paymentUpdate(PaymentUpdateRequest $request)
    {
        try {

            $payload = $request->validated();
            $transaction = $this->transactionService->processPayment($payload);

            $transaction->load(['creator.employee', 'initialPaymentMethod', 'outlet', 'details']);
            return response()->json([
                'success' => true,
                'status'  => 'success',
                'message' => 'Pelunasan Berhasil Disimpan',
                'data'    => new TransactionHistoryResource($transaction)
            ], 200);

        } catch (\Exception $e) {
            $code = ($e->getCode() < 400 || $e->getCode() > 599) ? 422 : $e->getCode();

            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => $e->getMessage()
            ], $code);
        }
    }

    public function cancel(CancelTransactionRequest $request)
    {
        try {
            $transaction = $this->transactionService->cancelTransaction(
                $request->transaction_id,   // sudah di-decrypt oleh prepareForValidation
                $request->reason,
            );

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan.',
                'data'    => new TransactionHistoryResource(
                    $transaction->load(['outlet', 'creator.employee', 'initialPaymentMethod'])
                ),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);

        } catch (\Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() <= 599)
                ? (int) $e->getCode()
                : 422;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }


}
