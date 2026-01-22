<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');

        // Jika tidak ada Origin (akses langsung browser/Postman), biarkan lewat tanpa header CORS
        if (!$origin) {
            return $next($request);
        }

        $host = parse_url($origin, PHP_URL_HOST);

        // ✅ DEV MODE
        if (in_array($host, ['localhost', '127.0.0.1'])) {
            return $this->handleAllowed($request, $next, $origin);
        }

        // ✅ PROD MODE (tenant based) dengan proteksi error
       
        try {
            $cacheKey = "cors_allowed_domain:" . $host;

            $isAllowed = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addDay(), function () use ($host) {
                return DB::table('Ms_tenants')
                    ->where('domain', $host)
                    ->where('is_active', true)
                    ->exists();
            });

            if (!$isAllowed) {
                return response()->json(['message' => 'CORS forbidden'], 403);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'CORS validation error'], 500);
        }

        return $this->handleAllowed($request, $next, $origin);
    }

    private function handleAllowed(Request $request, Closure $next, string $origin): Response
    {
        // Handle Preflight Request (OPTIONS)
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        $response = $next($request);

        // Tambahkan pengecekan apakah $response memiliki metode header
        if (method_exists($response, 'header')) {
            return $response
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}