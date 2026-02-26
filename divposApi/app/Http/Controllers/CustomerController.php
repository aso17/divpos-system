<?php

namespace App\Http\Controllers;

use App\Services\CustomerService;
use App\Http\Resources\CustomerResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    protected $service;

    public function __construct(CustomerService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        // Ambil tenant_id dari query param sesuai pattern React Anda
        $tenantId = $request->query('tenant_id'); 

        $data = $this->service->getDataList(
            $tenantId,
            $request->query('keyword'),
            $request->query('per_page', 10)
        );

        return CustomerResource::collection($data);
    }

    public function store(Request $request)
    {
        // 1. Validasi Input
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required',
            'name'      => 'required|string|min:3|max:100',
            'phone'     => 'required|string|max:20',
            'address'   => 'nullable|string|max:255',
            'created_by'=> 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(), 
                'message' => 'Validasi gagal'
            ], 422);
        }

        // 2. Ambil data yang diperlukan
        $validatedData = $request->only([
            'tenant_id', 
            'name', 
            'phone', 
            'address',
            'created_by'
        ]);

        $data = $this->service->createCustomer($validatedData);

        if (!$data) {
            return response()->json([
                'message' => 'Gagal memproses data customer.'
            ], 400);
        }

        // 3. Return Response sukses
        return response()->json([
            'message' => 'Customer berhasil didaftarkan',
            'data'    => new CustomerResource($data)
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required',
            'name'      => 'required|string|min:3|max:100',
            'phone'     => 'required|string|max:20',
            'address'   => 'nullable|string|max:255',
            'updated_by'=> 'required',
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
            'phone', 
            'address',
            'updated_by'
        ]);

        $data = $this->service->updateCustomer($id, $validatedData);

        if (!$data) {
            return response()->json([
                'message' => 'Gagal memperbarui data customer.'
            ], 400);
        }

        return response()->json([
            'message' => 'Data customer berhasil diperbarui',
            'data'    => new CustomerResource($data)
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $request->query('tenant_id'); 
        $deleted = $this->service->deleteCustomer($id, $tenantId);

        if (!$deleted) {
            return response()->json([
                'message' => 'Gagal menghapus customer.'
            ], 400);
        }

        return response()->json([
            'message' => 'Customer berhasil dihapus'
        ], 200);
    }
}