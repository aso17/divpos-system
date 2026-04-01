<?php

namespace App\Http\Controllers;

use App\Services\MenuService;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function menus(Request $request)
    {

        $menuData = MenuService::getMenuByUser($request->user());
        return response()->json([
            'menus'       => $menuData['tree'] ?? [],
            'permissions' => $menuData['map'] ?? [],


        ]);
    }
}
