<?php
namespace App\Http\Controllers;

use App\Services\MenuService;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function menus(Request $request)
    {
        // 1. Ambil data menu berdasarkan user (Owner vs Staff dideteksi di Service)
        $menuData = MenuService::getMenuByUser($request->user());
        
        // 2. Response yang konsisten
        return response()->json([
            'menus'       => $menuData['tree'] ?? [],
            'permissions' => $menuData['map'] ?? []
        ]);
    }
}