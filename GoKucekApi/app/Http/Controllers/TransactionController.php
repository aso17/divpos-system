<?php

namespace App\Http\Controllers;

use App\Services\PackageService;
use App\Services\CustomerService;
use App\Services\OutletService;
use App\Services\TransactionService;
use App\Http\Resources\PackageResource;
use App\Http\Resources\CustomerResource;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    protected $packageService, $customerService, $transactionService, $outletService;

    public function __construct(
        PackageService $packageService, 
        CustomerService $customerService,
        OutletService $outletService,
        TransactionService $transactionService
    ) {
        $this->packageService = $packageService;
        $this->customerService = $customerService;
        $this->outletService = $outletService;
        $this->transactionService = $transactionService;
    }

    // Dipanggil oleh TransactionService.getPackages() di React
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

    // Dipanggil oleh TransactionService.createTransaction(payload)
    public function store(Request $request)
    {
        // // Jalankan logic simpan transaksi (Next Step)
        // $result = $this->transactionService->createTransaction($request->all());
        
        // return response()->json(['message' => 'Transaksi Berhasil', 'data' => $result], 201);
    }
}