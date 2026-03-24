<?php

namespace App\Http\Controllers;

use App\Services\RegistrationService;
use App\Services\LogDbErrorService;
use App\Http\Requests\RegistrationRequest;

class RegistrationController extends Controller
{
    protected $registrationService;
    protected $logService;

    public function __construct(
        RegistrationService $registrationService,
        LogDbErrorService $logService
    ) {
        $this->registrationService = $registrationService;
        $this->logService = $logService;
    }

    public function getBusinessTypes()
    {
        try {
            $data = $this->registrationService->getBusinessTypesForRegistration();

            return response()->json([
                'success' => true,
                'data'    => $data
            ], 200);

        } catch (\Exception $e) {
            $this->logService->log($e);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jenis bisnis.'
            ], 500);
        }
    }

    public function store(RegistrationRequest $request)
    {
        try {
            // 1. Ambil data yang sudah lolos sensor dan ter-decrypt di Request
            $validated = $request->validated();

            // 2. Eksekusi Service (Insert 4-5 tabel di dalam Transaction)
            $result = $this->registrationService->registerNewTenant($validated);

            // 3. Response Berhasil
            return response()->json([
                'success' => true,
                'message' => 'Registrasi bisnis berhasil! Selamat datang di sistem.',
                'data'    => $result
            ], 201);

        } catch (\Exception $e) {
            // 4. Catat error secara detail (SQL Query, Bindings, dll)
            // Kita teruskan data request untuk context di log
            $this->logService->log($e);

            // 5. Response Gagal untuk Frontend
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendaftarkan bisnis. Terjadi kesalahan pada server.',
                'debug' => $e->getMessage() // Matikan ini jika sudah Production
            ], 500);
        }
    }
}
