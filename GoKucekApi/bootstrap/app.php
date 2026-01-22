<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\CorsMiddleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // ✅ REGISTER MIDDLEWARE ALIAS (WAJIB DI LARAVEL 11)
        $middleware->alias([
            'cors.tenant' => CorsMiddleware::class,
        ]);

        // 🔓 PUBLIC API (NO SANCTUM)
        $middleware->group('api-public', [
            'cors.tenant',
        ]);

        // 🔐 AUTH API (SANCTUM)
        $middleware->group('api', [
            'cors.tenant',
            EnsureFrontendRequestsAreStateful::class,
            'throttle:api',
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
