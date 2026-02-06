<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectInfoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\OutletController;
use App\Http\Controllers\MasterServiceController;

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

         // 👇 Master MODULE OUTLET
        Route::get('/outlet/generatecode', [OutletController::class, 'generatecode']); 
        Route::get('/outlet', [OutletController::class, 'index']); 
        Route::post('/outlet', [OutletController::class, 'store']); 
        Route::put('/outlet/{id}', [OutletController::class, 'update']); 
        Route::delete('/outlet/{id}', [OutletController::class, 'destroy']); 

        // 👇 Master MODULE SERVICE
       
        Route::get('/masterservice', [MasterServiceController::class, 'index']); 
        Route::post('/masterservice', [MasterServiceController::class, 'store']); 
        Route::put('/masterservice/{id}', [MasterServiceController::class, 'update']); 
        Route::delete('/masterservice/{id}', [MasterServiceController::class, 'destroy']); 

         // 👇 ROLE MODULE
        Route::get('/GetRolesByTenant', [RoleController::class, 'GetRolesByTenantId']); 
        Route::get('/role', [RoleController::class, 'index']); 
        Route::post('/role', [RoleController::class, 'store']); 
        Route::put('/role/{id}', [RoleController::class, 'update']); 
        Route::delete('/role/{id}', [RoleController::class, 'destroy']); 

         // 👇 ROLE MODULE PERMISSION       
        Route::get('/rolespermission', [RolePermissionController::class, 'index']); 
        Route::post('/rolespermission', [RolePermissionController::class, 'store']); 
        



    });
});