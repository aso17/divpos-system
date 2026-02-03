<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectInfoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RolePermissionController;

/*
|--------------------------------------------------------------------------
| PUBLIC API (Tanpa Autentikasi)
|--------------------------------------------------------------------------
*/
Route::middleware('api-public')->group(function () {
    Route::get('/project-info', [ProjectInfoController::class, 'show']);
    
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

        // 👇 USER MODULE
        Route::get('/user', [UserController::class, 'index']);      
        Route::get('/user/{id}', [UserController::class, 'show']); 
        Route::post('/user', [UserController::class, 'store']);     
        Route::put('/user/{id}', [UserController::class, 'update']); 
        Route::delete('/user/{id}', [UserController::class, 'destroy']); 

         // 👇 ROLE MODULE
        Route::get('/GetRolesByTenant', [RoleController::class, 'GetRolesByTenantId']); 
        Route::get('/roles', [RoleController::class, 'index']); 
        Route::post('/roles', [RoleController::class, 'store']); 
        Route::put('/roles/{id}', [RoleController::class, 'update']); 
        Route::delete('/roles/{id}', [RoleController::class, 'destroy']); 

         // 👇 ROLE MODULE PERMISSION       
        Route::get('/rolespermission', [RolePermissionController::class, 'index']); 
        Route::post('/rolespermission', [RolePermissionController::class, 'store']); 
        



    });
});