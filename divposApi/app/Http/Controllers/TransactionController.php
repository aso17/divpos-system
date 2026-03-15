<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransactionRequest;
use App\Http\Requests\PaymentUpdateRequest;
use Illuminate\Support\Facades\Cache;
use App\Services\PackageService;
use App\Services\CustomerService;
use App\Services\OutletService;
use App\Services\TransactionService;
use App\Services\PaymentMethodService;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\TransactionHistoryResource;
use App\Http\Resources\TransactionPaymentMethodResource;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\TransactionPackageResource;
use App\Http\Resources\TransactionOutletResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;



class TransactionController extends Controller
{
    protected $packageService, $customerService, $transactionService, $outletService, $paymentMethodService;

    public function __construct(
        PackageService $packageService, 
        CustomerService $customerService,
        OutletService $outletService,
        PaymentMethodService $paymentMethodService,
        TransactionService $transactionService
        
    ) {
        $this->packageService = $packageService;
        $this->customerService = $customerService;
        $this->outletService = $outletService;
        $this->paymentMethodService = $paymentMethodService;
        $this->transactionService = $transactionService;
       
    }

    
public function getInitData()
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
            'packages'        => $this->packageService->getAllPackagesTransaction($tenantId),
            'outlets'         => $this->outletService->getAllOutletsTransaction($tenantId),
            'payment_methods' => $this->paymentMethodService->getAllPaymentMethodsTransaction($tenantId),
            
        ];
    });

    return response()->json([
        'status' => 'success',
        'data' => [
            'packages'        => TransactionPackageResource::collection($data['packages']),
            'outlets'         => TransactionOutletResource::collection($data['outlets']),
            'payment_methods' => TransactionPaymentMethodResource::collection($data['payment_methods']),
            
        ]
    ]);
}
   
   public function getTransactionHistory(Request $request)
    {
        try {
            $data = $this->transactionService->getTransactionHistory($request->all());
            
            // Pakai HistoryResource agar response lebih ringan
            $resource = TransactionHistoryResource::collection($data)->response()->getData(true);

            return response()->json([
                'success' => true,
                'message' => "Riwayat transaksi berhasil diambil",
                'data'    => [
                    'data' => $resource['data'],
                    'meta' => $resource['meta'],
                ],
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
}