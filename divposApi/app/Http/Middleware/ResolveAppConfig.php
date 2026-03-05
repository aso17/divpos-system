<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\SystemConfiguration;
use Illuminate\Http\Request;
use App\Models\LogDbError;
use App\Helpers\CryptoHelper; 
use Illuminate\Support\Facades\Cache;

class ResolveAppConfig
{
    public function handle(Request $request, Closure $next)
    {
        $encryptedKeys = $request->query('keys');
        $configs = collect();

        // 1. Logic jika ada Custom Keys (Request via Encrypted Keys)
        if ($encryptedKeys && is_array($encryptedKeys)) {
            try {
                // Kita Cache per kombinasi keys agar tidak decrypt berulang kali
                $cacheKey = 'app_config_custom_' . md5(json_encode($encryptedKeys));
                
                $configs = Cache::remember($cacheKey, 3600, function () use ($encryptedKeys) {
                    $decryptedKeys = array_map(fn($key) => CryptoHelper::decrypt($key), $encryptedKeys);
                    return SystemConfiguration::whereIn('key', $decryptedKeys)->get();
                });
            } catch (\Exception $e) {
                $this->logError($request, 'Decryption failed: ' . $e->getMessage());
            }
        }

        // 2. Logic Default (Jika keys kosong atau gagal decrypt)
        if ($configs->isEmpty()) {
            $defaultNeededKeys = ["appName", "logo_path", "footer_text", "primary_color", "favicon_path"];
            
            // 🔥 CACHE UTAMA: Simpan config default selama 24 jam
            $configs = Cache::remember('app_config_default', 86400, function () use ($defaultNeededKeys) {
                return SystemConfiguration::whereIn('key', $defaultNeededKeys)->get();
            });
        }

        // 3. Simpan ke Container
        app()->instance('appconfig', $configs);

        return $next($request);
    }

    private function logError($request, $message)
    {
        LogDbError::create([
            'message'    => $message,
            'url'        => $request->fullUrl(),
            'ip_address' => $request->ip(),
        ]);
    }
}