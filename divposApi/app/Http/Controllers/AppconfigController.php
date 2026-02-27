<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;


class AppconfigController extends Controller
{
    public function show(Request $request)
    {
       
        if (!app()->has('appconfig')) {
            return response()->json(['message' => 'Configuration not initialized'], 500);
        }
        $configs = app('appconfig');
        $configArray = $configs->pluck('value', 'key')->toArray();

        if (isset($configArray['logo_path'])) {
            $cleanPath = ltrim($configArray['logo_path'], '/');
            $configArray['logo_path'] = asset("storage/" . $cleanPath);
        }
        if (isset($configArray['favicon_path'])) {
             $cleanPath = ltrim($configArray['favicon_path'], '/');
            $configArray['favicon_path'] = asset("storage/" . $cleanPath);
        }

        return response()->json($configArray);
    }
}