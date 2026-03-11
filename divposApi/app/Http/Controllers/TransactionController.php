<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Validator;
use App\Services\PackageService;
use App\Services\CustomerService;
use App\Services\OutletService;
use App\Services\TransactionService;
use App\Services\PaymentMethodService;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\TransactionPaymentMethodResource;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\TransactionPackageResource;
use App\Http\Resources\TransactionOutletResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper; 


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
            return response()->json([
                'status'  => 'error',
                'message' => 'Access denied. Profil bisnis tidak ditemukan.'
            ], 403);
        }

    
        $packages = $this->packageService->getAllPackagesTransaction($tenantId); 
        $outlets = $this->outletService->getAllOutletsTransaction($tenantId);
        $paymentMethods = $this->paymentMethodService->getAllPaymentMethodsTransaction($tenantId);

        return response()->json([
            'status' => 'success',
            'data' => [
                'packages'        => TransactionPackageResource::collection($packages ?? collect([])),
                'outlets'         => TransactionOutletResource::collection($outlets ?? collect([])),
                'payment_methods' => TransactionPaymentMethodResource::collection($paymentMethods ?? collect([])),
            ]
        ]);
    }
   

    public function getTransactionHistory(Request $request)
    {
        $data = $this->transactionService->getTransactionHistory($request->all());
        $formattedData = TransactionResource::collection($data)->response()->getData(true);

        return response()->json([
            'success' => true,
            'data'    => $formattedData,
            'message' => "Riwayat transaksi berhasil diambil",
        ], 200);
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

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer.name' => 'required|string|max:100|regex:/^[a-zA-Z0-9\s\.]+$/', 
            'customer.phone' => 'required|string|min:10|max:15|regex:/^[0-9]+$/',
            'payment_amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.package_id' => 'required',
            'items.*.qty' => 'required|numeric|min:0.1',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }
        
        try {
            $data = [
                'tenant_id'         => CryptoHelper::decrypt($request->tenant_id),
                'outlet_id'         => CryptoHelper::decrypt($request->outlet_id),
                'payment_method_id' => CryptoHelper::decrypt($request->payment_method_id),
                'created_by'        => CryptoHelper::decrypt($request->created_by),
                'customer'          => $request->input('customer'),
                'items'             => $request->input('items'),
                'payment_amount'    => (int) round($request->payment_amount), // Pastikan bulat sejak awal
            ];

            if (!$data['tenant_id']) return response()->json(['message' => 'Invalid Context'], 400);

            // Langsung serahkan ke Service tanpa hitung apapun di sini
            $transaction = $this->transactionService->createTransaction($data);

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi Berhasil',
                'data' => $transaction->load(['details', 'customer', 'outlet', 'initialPaymentMethod'])
            ], 201);

        } catch (\Exception $e) {
            // Exception akan menangkap throw dari service (misal: "Uang kurang")
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }
}