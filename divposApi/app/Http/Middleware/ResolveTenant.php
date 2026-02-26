<?php
namespace App\Http\Middleware;

use Closure;
use App\Models\Ms_tenant as Tenant;
use Illuminate\Http\Request;

class ResolveTenant
{
    public function handle(Request $request, Closure $next)
    {
        $tenantCode = $request->header('X-Tenant-Code');

        if ($tenantCode) {
            $tenant = Tenant::where('code', $tenantCode)
                ->where('is_active', true)
                ->first();
        } else {
            // fallback ke default tenant
            $tenant = Tenant::where('is_default', true)
                ->where('is_active', true)
                ->first();
        }

        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        // 🔥 Simpan ke container
        app()->instance('tenant', $tenant);

        return $next($request);
    }
}
