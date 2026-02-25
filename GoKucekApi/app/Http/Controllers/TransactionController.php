<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Validator;
use App\Services\PackageService;
use App\Services\CustomerService;
use App\Services\OutletService;
use App\Services\TransactionService;
use App\Services\PaymentMethodService;
use App\Http\Resources\PackageResource;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\PaymentMethodResource;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\OutletResource;
use Illuminate\Http\Request;
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

    

   public function getInitData(Request $request)
{
    $tenantId = $request->query('tenant_id');
    
    if (!$tenantId) {
        return response()->json(['message' => 'Invalid Tenant'], 400);
    }

    // 1. Ambil data Paket (Gunakan optional atau check null)
    $packageQuery = $this->packageService->getAllPackages([
        'tenant_id' => $tenantId,
        'is_active' => true
    ]);
    
    $packages = $packageQuery ? $packageQuery->get() : collect([]);

    // 2. Ambil data Outlet
    $outletQuery = $this->outletService->getAllOutlets([
        'tenant_id' => $tenantId,
        'is_active' => true
    ]);
    $outlets = $outletQuery ? $outletQuery->get() : collect([]);

    $paymentMethods = $this->paymentMethodService->getAllPaymentMethods(
        $tenantId, 
        null, 
        100
    );

    // 4. Ambil data Customers
    $customers = $this->customerService->getDataList(
        $tenantId,
        null,
        50 
    );

    return response()->json([
        'status' => 'success',
        'data' => [
            'packages' => PackageResource::collection($packages),
            'outlets' => OutletResource::collection($outlets),
            'payment_methods' => PaymentMethodResource::collection($paymentMethods),
            'customers' => CustomerResource::collection($customers),
        ]
    ]);
}
    public function getPackages(Request $request)
    {
        $data = $this->packageService->getAllPackages([
            'tenant_id' => $request->query('tenant_id'),
            'is_active' => true
        ]);
        
        return PackageResource::collection($data->get());
    }

    public function getOutlets(Request $request)
    {
        $data = $this->outletService->getAllOutlets([
            'tenant_id' => $request->query('tenant_id'),
            'is_active' => true
        ]);
        
        return PackageResource::collection($data->get());
    }
   
    public function getPaymentMethods(Request $request)
    {
        // Ambil parameter dari request
        $tenantId = $request->query('tenant_id');
        $keyword = $request->query('keyword'); 
        $perPage = $request->query('per_page', 100);

        // Panggil service dengan parameter individu
        $data = $this->paymentMethodService->getAllPaymentMethods(
            $tenantId, 
            $keyword, 
            $perPage
        );
        
        // Resource::collection otomatis menangani data hasil paginate()
        return PaymentMethodResource::collection($data);
    }

    public function getTransactionHistory(Request $request)
    {
        $data = $this->transactionService->getTransactionHistory($request->all());
        $formattedData = TransactionResource::collection($data)->response()->getData(true);

        // Ini isi manual dari apa yang biasanya dilakukan sendResponse
        return response()->json([
            'success' => true,
            'data'    => $formattedData,
            'message' => "Riwayat transaksi berhasil diambil",
        ], 200);
    }

    // Dipanggil oleh TransactionService.getCustomers() di React
    public function getCustomers(Request $request)
    {
        $data = $this->customerService->getDataList(
            $request->query('tenant_id'),
            $request->query('keyword'),
            1000 // Limit besar agar pencarian di frontend (customers.find) akurat
        );

        return CustomerResource::collection($data);
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