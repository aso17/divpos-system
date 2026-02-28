<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');

        // Jika tidak ada Origin (Postman, curl, same-origin)
        if (!$origin) {
            return $next($request);
        }

        $allowedOrigins = $this->allowedOrigins();

        if (!in_array($origin, $allowedOrigins, true)) {
            return response()->json([
                'message' => 'CORS forbidden'
            ], 403);
        }

        return $this->handleAllowed($request, $next, $origin);
    }

    /**
     * Daftar origin yang diizinkan
     */
    private function allowedOrigins(): array
    {
        $origins = [];

        // Frontend production (WAJIB set di config/app.php atau .env)
        if (config('app.frontend_url')) {
            $origins[] = rtrim(config('app.frontend_url'), '/');
        }

        // Development mode
        if (config('app.debug')) {
            $origins = array_merge($origins, [
                'http://localhost:5173',
                'http://127.0.0.1:5173',
                'http://192.168.0.118:5173',
            ]);
        }

        return $origins;
    }

    private function handleAllowed(Request $request, Closure $next, string $origin): Response
    {
        $headers = [
            'Access-Control-Allow-Origin'      => $origin,
            'Access-Control-Allow-Methods'     => 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers'     => 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Allow-Credentials' => 'true',
        ];

        // Preflight request
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)->withHeaders($headers);
        }

        $response = $next($request);

        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }
}