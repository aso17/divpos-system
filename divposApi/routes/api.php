<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    ProjectInfoController,
    AppconfigController,
    AuthController,
    MenuController,
    UserController,
    RoleController,
    RolePermissionController,
    OutletController,
    MasterServiceController,
    PackageController,
    CategoryController,
    CustomerController,
    TransactionController,
    PaymentMethodController
};

/*
|--------------------------------------------------------------------------
| 1️⃣ PUBLIC AREA
|--------------------------------------------------------------------------
*/
Route::middleware('api-public')->group(function () {
    Route::get('/project-info', [ProjectInfoController::class, 'show']);
    Route::get('/app-config', [AppconfigController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| 2️⃣ AUTH AREA
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->middleware('api')->group(function () {

    // 🔐 Login with strict throttle
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:50,1');

    Route::post('/refresh', [AuthController::class, 'refresh']);

    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', fn (Request $request) => 
            $request->user()->load('tenant')
        );

        Route::get('/menus', [MenuController::class, 'menus']);
    });
});

/*
|--------------------------------------------------------------------------
| 3️⃣ PROTECTED BUSINESS MODULES
|--------------------------------------------------------------------------
*/
Route::middleware(['api', 'auth:sanctum'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | TRANSACTIONS
    |--------------------------------------------------------------------------
    */
    Route::prefix('transactions')->group(function () {
        Route::get('/init-data', [TransactionController::class, 'getInitData']);
        Route::get('/history', [TransactionController::class, 'getTransactionHistory']);
        Route::get('/packages', [TransactionController::class, 'getPackages']);
        Route::get('/customers', [TransactionController::class, 'getCustomers']);
        Route::get('/outlets', [TransactionController::class, 'getOutlets']);
        Route::get('/payment-methods', [TransactionController::class, 'getPaymentMethods']);
        Route::post('/', [TransactionController::class, 'store']);
    });

    /*
    |--------------------------------------------------------------------------
    | MASTER DATA (Plural RESTful Naming)
    |--------------------------------------------------------------------------
    */
    Route::apiResource('users', UserController::class);

    Route::get('/outlets/generate-code', [OutletController::class, 'generateCode']);
    Route::apiResource('outlets', OutletController::class);

    Route::apiResource('master-services', MasterServiceController::class);

    Route::get('/packages/generate-code', [PackageController::class, 'generateCode']);
    Route::apiResource('packages', PackageController::class);

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('payment-methods', PaymentMethodController::class);

    /*
    |--------------------------------------------------------------------------
    | ACCESS CONTROL
    |--------------------------------------------------------------------------
    */
    Route::prefix('access-control')->group(function () {

        Route::get('/roles-by-tenant', [RoleController::class, 'getRolesByTenantId']);

        Route::apiResource('roles', RoleController::class);

        Route::apiResource('role-permissions', RolePermissionController::class)
            ->only(['index', 'store']);
    });
});