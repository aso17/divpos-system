<?php

namespace App\Http\Controllers;

use App\Services\PaymentMethodService;
use App\Http\Resources\PaymentMethodResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentMethodController extends Controller
{
    protected $service;

    public function __construct(PaymentMethodService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
       
        $tenantId = $request->query('tenant_id'); 

        $data = $this->service->getAllPaymentMethods(
            $tenantId,
            $request->query('keyword'),
            $request->query('per_page', 10)
        );

        return PaymentMethodResource::collection($data);
    }
    

    public function store(Request $request)
    {
        // 1. Validasi Input sesuai style yang kamu minta
        $validator = Validator::make($request->all(), [
            'tenant_id'      => 'required',
            'name'           => 'required|string|min:3|max:100|regex:/^[a-zA-Z0-9\s\-\(\)]+$/',
            'type'           => 'required|in:CASH,TRANSFER,E-WALLET',
            'account_number' => 'required_if:type,TRANSFER,E-WALLET|nullable|string|max:50',
            'account_name'   => 'required_if:type,TRANSFER,E-WALLET|nullable|string|max:100',
            'description'    => 'nullable|string|max:255',
            'is_active'      => 'boolean',
            'created_by'     => 'required',
        ], [
            'account_number.required_if' => 'Nomor rekening wajib diisi untuk tipe Transfer/E-Wallet',
            'account_name.required_if'   => 'Nama pemilik rekening wajib diisi untuk tipe Transfer/E-Wallet',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(), 
                'message' => 'Validasi gagal'
            ], 422);
        }

        // 2. Ambil data yang hanya diperlukan saja
        $validatedData = $request->only([
            'tenant_id', 
            'name', 
            'type', 
            'account_number', 
            'account_name', 
            'description', 
            'is_active', 
            'created_by'
        ]);

        $data = $this->service->createPaymentMethod($validatedData);

        if (!$data) {
            return response()->json([
                'message' => 'Gagal memproses data. Pastikan sesi login dan tenant valid.'
            ], 400);
        }

        // 4. Return Response sukses
        return response()->json([
            'message' => 'Metode pembayaran berhasil dibuat',
            'data'    => new PaymentMethodResource($data)
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tenant_id'      => 'required',
            'name'           => 'required|string|min:3|max:100|regex:/^[a-zA-Z0-9\s\-\(\)]+$/',
            'type'           => 'required|in:CASH,TRANSFER,E-WALLET',
            'account_number' => 'required_if:type,TRANSFER,E-WALLET|nullable|string|max:50',
            'account_name'   => 'required_if:type,TRANSFER,E-WALLET|nullable|string|max:100',
            'description'    => 'nullable|string|max:255',
            'is_active'      => 'boolean',
            'updated_by'     => 'required',
        ], [
            'account_number.required_if' => 'Nomor rekening wajib diisi untuk tipe Transfer/E-Wallet',
            'account_name.required_if'   => 'Nama pemilik rekening wajib diisi untuk tipe Transfer/E-Wallet',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(), 
                'message' => 'Validasi gagal'
            ], 422);
        }

        $validatedData = $request->only([
            'tenant_id', 
            'name', 
            'type', 
            'account_number', 
            'account_name', 
            'description', 
            'is_active', 
            'updated_by'
        ]);

        $data = $this->service->updatePaymentMethod($id, $validatedData);

        if (!$data) {
            return response()->json([
                'message' => 'Gagal memproses data. Pastikan sesi login dan tenant valid.'
            ], 400);
        }

        return response()->json([
            'message' => 'Metode pembayaran berhasil diperbarui',
            'data'    => new PaymentMethodResource($data)
        ], 200);
    }


    public function destroy(Request $request, $id)
    {
        $tenantId = $request->query('tenant_id'); 
        $deleted = $this->service->deletePaymentMethod($id, $tenantId);

        if (!$deleted) {
            return response()->json([
                'message' => 'Gagal menghapus data. Pastikan sesi login dan tenant valid.'
            ], 400);
        }

        return response()->json([
            'message' => 'Metode pembayaran berhasil dihapus'
        ], 200);
    }
}