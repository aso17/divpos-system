<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use App\Models\SystemConfiguration;
use App\Http\Resources\AuthResource;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * 🔐 Login
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $result = $this->authService->attemptLogin(
            $credentials,
            $request->ip(),
            $request->userAgent()
        );

       

    return response()->json([
        'token'         => $result['token'],
        'refresh_token' => $result['refresh_token'],
        'user'          => new AuthResource($result['user']),
        'app_config'    => $this->getFormattedAppConfig(), 
    ]);
       
    }

   private function getFormattedAppConfig()
    {
       
        return \Illuminate\Support\Facades\Cache::remember('system_app_configs_final', 86400, function() {
            $neededKeys = ["appName", "logo_path", "footer_text", "primary_color", "favicon_path"];
            
            $rawConfigs = \App\Models\SystemConfiguration::whereIn('key', $neededKeys)
                ->pluck('value', 'key')
                ->toArray();

            $formatted = [];

            foreach ($neededKeys as $key) {
                $value = $rawConfigs[$key] ?? null;

                // Logic Formatting disatukan di sini
                if (in_array($key, ['logo_path', 'favicon_path'])) {
                    $formatted[$key] = !empty($value) 
                        ? asset("storage/" . ltrim($value, '/'))
                        : asset("assets/images/default-{$key}.png");
                } else {
                    $formatted[$key] = $value ?? ($key === 'primary_color' ? '#3B82F6' : null);
                }
            }

            return $formatted;
        });
    }
        

    /**
     * 🔁 Refresh Access Token
     */
    public function refresh(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required|string'
        ]);

        $result = $this->authService->refreshToken(
            $request->refresh_token,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'token'         => $result['token'],
            'refresh_token' => $result['refresh_token'],
        ]);
    }

    /**
     * 🚪 Logout (per device)
     */
    public function logout(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required|string'
        ]);

        $this->authService->logout(
            $request->user(),
            $request->refresh_token
        );

        return response()->json([
            'message' => 'Berhasil logout'
        ]);
    }
}