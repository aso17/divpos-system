<?php

namespace App\Http\Controllers;

use App\Services\MenuService;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function menus(Request $request)
    {

        $menuData = MenuService::getMenuByUser($request->user());
        // 2. Response yang konsisten
        return response()->json([
            'menus'       => $menuData['tree'] ?? [],
            'us' => $request->user(),
            'permissions' => $menuData['map'] ?? [],


        ]);
    }
}
