<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectInfoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;

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
        Route::get('/user', [UserController::class, 'index']);      // getUsers
        Route::get('/user/{id}', [UserController::class, 'show']);  // getUserById
        Route::post('/user', [UserController::class, 'store']);     // createUser
        Route::put('/user/{id}', [UserController::class, 'update']); // updateUser
        Route::delete('/user/{id}', [UserController::class, 'destroy']); // deleteUser

         // 👇 ROLE MODULE
        Route::get('/roles', [RoleController::class, 'index']); 
    });
});