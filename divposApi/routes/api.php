<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AppconfigController,
    RegistrationController,
    AuthController,
    MenuController,
    UserController,
    RoleController,
    RolePermissionController,
    OutletController,
    MasterServiceController,
    PackageController,
    CategoryController,
    UnitController,
    EmployeeController,
    CustomerController,
    TransactionController,
    PaymentMethodController,
    DashboardController,
    PaymentRecapController,
    RevenueReportController
};

/*
|--------------------------------------------------------------------------
| 1️⃣ PUBLIC AREA
|--------------------------------------------------------------------------
*/


Route::middleware('api-public')->group(function () {
    // Route::get('/project-info', [ProjectInfoController::class, 'show']);
    Route::get('/app-config', [AppconfigController::class, 'show']);
    Route::get('/busines-type', [RegistrationController::class, 'getBusinessTypes']);
    Route::post('/register', [RegistrationController::class, 'store']);
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
        Route::get('/me', function (Request $request) {
            return $request->user()->load(['employee.tenant', 'employee.outlet']);
        });

        Route::get('/menus', [MenuController::class, 'menus']);
    });
});

/*
|--------------------------------------------------------------------------
| 3️⃣ PROTECTED BUSINESS MODULES
|--------------------------------------------------------------------------
*/
Route::middleware(['api', 'auth:sanctum'])->group(function () {

    Route::get('dashboard', [DashboardController::class, 'index']);
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
        Route::get('/searchemployee', [TransactionController::class, 'searchEmployeTransaction']);
        Route::post('/', [TransactionController::class, 'store']);
        Route::post('/paymentUpdate', [TransactionController::class, 'paymentUpdate']);
        Route::patch('cancel', [TransactionController::class, 'cancel']);
    });

    /*
    |--------------------------------------------------------------------------
    | MASTER DATA (Plural RESTful Naming)
    |--------------------------------------------------------------------------
    */
    Route::apiResource('users', UserController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::get('get-available-employees', [UserController::class, 'getavailableemployees']);
    Route::apiResource('employees', EmployeeController::class);

    Route::apiResource('outlets', OutletController::class);

    Route::apiResource('master-services', MasterServiceController::class);

    Route::apiResource('packages', PackageController::class);

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('units', UnitController::class);
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


    Route::prefix('reports')->group(function () {

        // ── Rekap Pembayaran ─────────────────────────────────────────
        Route::controller(PaymentRecapController::class)->group(function () {
            Route::get('payments', 'index');   // List + summary
            Route::get('payments/export', 'export');  // Export CSV/Excel
        });

        // ── Rekap Pembayaran ─────────────────────────────────────────
        Route::controller(RevenueReportController::class)->group(function () {
            Route::get('revenue', 'index');   // List + summary
            Route::get('payments/export', 'export');  // Export CSV/Excel
        });

        // ── Analisa Pendapatan (tambah controller baru jika sudah siap) ──
        // Route::controller(RevenueAnalysisController::class)->group(function () {
        //     Route::get('revenue',        'index');
        //     Route::get('revenue/export', 'export');
        // });

    });
});
