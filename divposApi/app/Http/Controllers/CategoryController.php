<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Services\CategoryService;
use Illuminate\Http\Request;
use App\Http\Requests\CategoryRequest;
use App\Services\LogDbErrorService;
use Illuminate\Support\Facades\Auth;

class CategoryController extends Controller
{
    protected $service;
    protected $logService;

    public function __construct(CategoryService $service,LogDbErrorService $logService)
    {
        $this->service = $service;
         $this->logService = $logService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee->tenant_id;
      if (!$tenantId) {
        return response()->json([
            'message' => 'Access denied. You do not have permission to perform this action.'
        ], 403);
         }

        $params = [
            'tenant_id' => $tenantId,
            'keyword' => $request->query('keyword'),
        ];
          
        $categories = $this->service->getPaginatedCategories($params);
        return CategoryResource::collection($categories);
    }

  /**
 * STORE
 */
    public function store(CategoryRequest $request)
    {
        try {
            
            $tenantId = $request->tenantId; 
            $payload = $request->validated();
            $payload['tenant_id'] = $tenantId;

            $category = $this->service->storeCategory($payload);

            return response()->json([
                'status' => 'success',
                'message' => 'Kategori baru berhasil ditambahkan',
                'data' => new CategoryResource($category)
            ], 201); 

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'status' => 'error', 
                'message' => 'Gagal menyimpan data kategori'.$e->getMessage()
            ], 500);
        }
    }

/**
 * UPDATE
 */
        public function update(CategoryRequest $request, $id)
    {
        try {
           
            $tenantId = (int) $request->tenantId;        
            $realId = $request->id;
            $payload = $request->validated();
            $category = $this->service->updateCategory($realId, $tenantId,$payload);

            return response()->json([
                'status' => 'success',
                'pa'=>$tenantId,
                'message' => 'Kategori berhasil diperbarui',
                'data' => new CategoryResource($category)
            ], 200);

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'status' => 'error',   
                'message' => $e->getMessage()
            ], 400);
        }
    }

   public function destroy($id)
    {
        try {
           
            $tenantId = Auth::user()->employee->tenant_id;
            $this->service->deleteCategory($id, $tenantId);

            return response()->json([
                'status' => 'success',
                'message' => 'Kategori berhasil dihapus'
            ], 200);

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'status' => 'error', 
                'message' => $e->getMessage() 
            ], 400);
        }
    }
}