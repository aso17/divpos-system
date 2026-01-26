<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProjectInfoController extends Controller
{
    public function show(Request $request)
    {
        $tenant = app('tenant'); // 🔥 dari ResolveTenant middleware

        return response()->json([
            'name'          => $tenant->name,
            'logo_path'     => $tenant->logo_path ? asset("storage{$tenant->logo_path}") : null,
            'primary_color' => $tenant->primary_color,
            'theme'         => $tenant->theme,
        ]);
    }
}

