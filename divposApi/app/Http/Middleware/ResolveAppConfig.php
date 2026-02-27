<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\SystemConfiguration;
use Illuminate\Http\Request;
use App\Models\LogDbError;
use App\Helpers\CryptoHelper; 

class ResolveAppConfig
{
    public function handle(Request $request, Closure $next)
    {
        $encryptedKeys = $request->query('keys');
        $configs = collect();

        // 1. Cek apakah ada parameter encryptedKeys
        if ($encryptedKeys && is_array($encryptedKeys)) {
            try {
                // Dekripsi setiap key
                $decryptedKeys = array_map(function ($encryptedKey) {
                    return CryptoHelper::decrypt($encryptedKey);
                }, $encryptedKeys);

                // Ambil config berdasarkan key yang didekripsi
                $configs = SystemConfiguration::whereIn('key', $decryptedKeys)->get();
            } catch (\Exception $e) {
                // Log error jika dekripsi gagal
                LogDbError::create([
                    'message' => 'Decryption failed in ResolveAppConfig: ' . $e->getMessage(),
                    'url' => $request->fullUrl(),
                    'ip_address' => $request->ip(),
                ]);
                // Pastikan configs tetap kosong agar jatuh ke logic default di bawah
                $configs = collect();
            }
        }
        if ($configs->isEmpty()) {
            // Definisikan key default yang benar-benar dibutuhkan aplikasi
            $defaultNeededKeys = ["appName", "logo_path", "footer_text", "primary_color"];
            $configs = SystemConfiguration::whereIn('key', $defaultNeededKeys)->get();
        }

        // 3. Simpan ke container sebagai Collection
        app()->instance('appconfig', $configs);

        return $next($request);
    }
}