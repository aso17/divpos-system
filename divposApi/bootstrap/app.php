<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\CorsMiddleware;
// use App\Http\Middleware\ResolveTenant;
use App\Http\Middleware\ResolveAppConfig;


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
            'cors.main' => CorsMiddleware::class,
            'resolve.appconfig' => ResolveAppConfig::class,
            // 'resolve.tenant' => ResolveTenant::class,
        ]);

        // 🔓 PUBLIC API (NO SANCTUM)
        $middleware->group('api-public', [
            'cors.main',
            'resolve.appconfig',
            'throttle:30,1',
            // 'resolve.tenant',
        ]);

        // 🔐 AUTH API (SANCTUM)
        $middleware->group('api', [
            EnsureFrontendRequestsAreStateful::class,
            'cors.main',           
            'throttle:150,1',
            // 'resolve.tenant',
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
