<?php

namespace App\Http\Controllers;

use App\Services\PackageService;
use App\Services\CustomerService;
use App\Services\OutletService;
use App\Services\TransactionService;
use App\Services\PaymentMethodService;
use App\Http\Resources\PackageResource;
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
    try {
        // 1. Dekripsi ID yang diperlukan
        $tenantId = CryptoHelper::decrypt($request->tenant_id);
        $outletId = CryptoHelper::decrypt($request->outlet_id);
        $paymentMethodId = CryptoHelper::decrypt($request->payment_method_id);
        $createdBy = CryptoHelper::decrypt($request->created_by);

        if (!$tenantId) {
            return response()->json(['message' => 'Invalid Tenant Context'], 400);
        }

        // 2. Ambil data customer dari request (pakai fallback array agar tidak error undefined key)
        $customerData = $request->input('customer', []); 
        
        // 3. Kalkulasi Harga Aman
        $items = $request->input('items', []);
        $calculatedItems = [];
        $grandTotalServer = 0;

        foreach ($items as $item) {
            $packageId = CryptoHelper::decrypt($item['package_id']); 
            $package = $this->packageService->getPackageById($packageId);
            
            if (!$package) continue;

            $subtotal = $package->price * $item['qty'];
            $grandTotalServer += $subtotal;

            $calculatedItems[] = [
                'package_id'   => $packageId,
                'package_name' => $package->name, // Ambil nama asli dari DB
                'qty'          => $item['qty'],
                'price'        => $package->price,
                'subtotal'     => $subtotal
            ];
        }

        // 4. KIRIM SEMUA KE SERVICE (Termasuk data customer mentah)
        // Dengan begini, handleCustomer akan berjalan DI DALAM DB::transaction
        $transaction = $this->transactionService->createTransaction([
            'tenant_id'         => $tenantId,
            'outlet_id'         => $outletId,
            'customer'          => [
                'name'  => $customerData['name'] ?? 'Guest',
                'phone' => $customerData['phone'] ?? '-'
            ],
            'payment_method_id' => $paymentMethodId,
            'items'             => $calculatedItems,
            'grand_total'       => $grandTotalServer,
            'payment_amount'    => $request->payment_amount,
            'change_amount'     => $request->payment_amount - $grandTotalServer,
            'created_by'        => $createdBy,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi Berhasil',
            'data' => $transaction
        ], 201);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Gagal memproses transaksi: ' . $e->getMessage()
        ], 500);
    }
}
}