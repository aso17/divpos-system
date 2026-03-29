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

            $validated = $request->validated();
            $result = $this->registrationService->registerNewTenant($validated);

            return response()->json([
                'success' => true,
                'message' => 'Registrasi bisnis berhasil! Selamat datang di sistem.',
               'data'    => [
                        'tenant_name' => $result['tenant_name'],
                        'owner_email' => $result['owner_email'],
                        ]
            ], 201);

        } catch (\Exception $e) {
            // 4. Catat error secara detail melalui LogService
            $this->logService->log($e);

            // 5. Response Gagal
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendaftarkan bisnis. Silakan coba beberapa saat lagi.',
                // Tampilkan debug hanya jika environment bukan production
                'debug'   => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
