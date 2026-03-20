<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CustomerController
 * Alur: Controller → Service → Repository
 *       Controller ← Resource (format output)
 */
class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $service
    ) {
    }

    // ── GET /customers ────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        try {
            $customers = $this->service->list($request->all());
            $stats     = $this->service->stats();

            $resource = CustomerResource::collection($customers)
                ->response()
                ->getData(true);

            return response()->json([
                'success' => true,
                'message' => 'Data pelanggan berhasil diambil.',
                'stats'   => $stats,
                'data'    => $resource,
            ], 200);

        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    // ── GET /customers/{id} ───────────────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        try {
            $customer = $this->service->findOrFail($id);

            return response()->json([
                'success' => true,
                'data'    => new CustomerResource($customer),
            ], 200);

        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    // ── POST /customers ───────────────────────────────────────────────────────
    public function store(CustomerRequest $request): JsonResponse
    {
        try {
            $customer = $this->service->create($request->validated());

            return response()->json([
                'success' => true,

                'message' => 'Pelanggan berhasil ditambahkan.',
                'data'    => new CustomerResource($customer),
            ], 201);

        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    // ── PUT /customers/{id} ───────────────────────────────────────────────────
    public function update(CustomerRequest $request): JsonResponse
    {
        try {

            $idCus = (int)$request->id;
            $customer = $this->service->update($idCus, $request->validated());

            return response()->json([
                'data' => $idCus,
                'success' => true,
                'message' => 'Data pelanggan berhasil diperbarui.',
                'data'    => new CustomerResource($customer),
            ], 200);

        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    // ── DELETE /customers/{id} ────────────────────────────────────────────────
    public function destroy($id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return response()->json([
                'success' => true,
                'message' => 'Pelanggan berhasil dihapus.',
            ], 200);

        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    // ── Private helper ────────────────────────────────────────────────────────
    private function errorResponse(\Exception $e): JsonResponse
    {
        $code = ($e->getCode() >= 400 && $e->getCode() <= 599)
            ? (int) $e->getCode()
            : 500;

        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], $code);
    }
}
