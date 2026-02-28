<?php
namespace App\Http\Controllers;
use App\Services\MenuService;
use Illuminate\Http\Request;

class MenuController extends Controller
{
   // Dalam MenuController.php
   public function menus(Request $request)
    {
        $user = $request->user();      
        
        // 1. Ambil data dari Service (hasilnya array: ['tree' => ..., 'map' => ...])
        $menuData = MenuService::getMenuByRole($user->role_id);
        
        // 2. Pastikan data yang dikembalikan ada kuncinya sebelum diakses
        if (!isset($menuData['tree']) || !isset($menuData['map'])) {
            return response()->json([
                'message' => 'Failed to generate menu structure.'
            ], 500);
        }

        // 3. Kembalikan respons JSON dengan kunci yang benar
        return response()->json([
            'menus' => $menuData['tree'],        // Kunci 'tree' dari Service
            'permissions' => $menuData['map'],  // Kunci 'map' dari Service
            // 'map' => $user    // Kunci 'map' dari Service
        ]);
    }
}
