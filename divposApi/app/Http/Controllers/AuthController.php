<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use App\Http\Resources\LoginResource;
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
            'user'          => new LoginResource($result['user'])
        ]);
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