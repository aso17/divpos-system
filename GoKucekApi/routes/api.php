<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectInfoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;

/*
|--------------------------------------------------------------------------
| PUBLIC API (Tanpa Autentikasi)
|--------------------------------------------------------------------------
*/
Route::middleware('api-public')->group(function () {
    Route::get('/project-info', [ProjectInfoController::class, 'show']);
    Route::get('/Testmenus', [MenuController::class, 'menus']);
});

/*
|--------------------------------------------------------------------------
| AUTH API (Grup 'api' untuk Statefulness)
|--------------------------------------------------------------------------
*/


Route::middleware('api')->group(function () {
    
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', fn (Request $request) => $request->user());
        Route::get('/menus', [MenuController::class, 'menus']);
    });
});