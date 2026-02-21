<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Services\CategoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    protected $service;

    public function __construct(CategoryService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $categories = $this->service->getPaginatedCategories($request->all());
        return CategoryResource::collection($categories);
    }

   public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'duration_hours' => 'required|integer|min:0',
            'tenant_id' => 'required',
            'created_by' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            $category = $this->service->storeCategory($request->all());
            return response()->json([
                'status' => 'success',
                'message' => 'Kategori baru berhasil ditambahkan',
                'data' => new CategoryResource($category)
            ], 201); // 201 Created
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'duration_hours' => 'required|integer|min:0',
            'tenant_id' => 'required',
            'updated_by' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $category = $this->service->updateCategory($id, $request->all());
            return response()->json([
                'status' => 'success',
                'message' => 'Kategori berhasil diperbarui',
                'data' => new CategoryResource($category)
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 404);
        }
    }

    // DELETE
    public function destroy(Request $request, $id)
    {
        try {
            $this->service->deleteCategory($id, $request->tenant_id);
            return response()->json([
                'status' => 'success',
                'message' => 'Kategori berhasil dihapus selamanya'
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 404);
        }
    }
}