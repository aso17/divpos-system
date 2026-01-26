<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\CorsMiddleware;
use App\Http\Middleware\ResolveTenant;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'cors.tenant' => CorsMiddleware::class,
            'resolve.tenant' => ResolveTenant::class,
        ]);

        // 🔓 PUBLIC API (NO SANCTUM)
        $middleware->group('api-public', [
            'cors.tenant',
            'resolve.tenant',
            'throttle:30,1',
        ]);

        // 🔐 AUTH API (SANCTUM)
        $middleware->group('api', [
            'cors.tenant',
            'resolve.tenant',
            EnsureFrontendRequestsAreStateful::class,
            'throttle:150,1',
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
