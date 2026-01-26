<?php

namespace App\Http\Controllers;

use App\Models\Ms_role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * GET /api/roles
     */
    public function index(Request $request)
    {
        $roles = Ms_role::select('id', 'role_name', 'code')
            ->where('is_active', true)
            ->orderBy('role_name')
            ->get();

        return response()->json($roles);
    }
}
