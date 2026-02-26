<?php
namespace App\Http\Controllers;
use App\Services\MenuService;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function menus(Request $request)
    {
        $user = $request->user();      
        return response()->json([
            'menus' => MenuService::getMenuByRole($user->role_id)
        ]);
    }
}
