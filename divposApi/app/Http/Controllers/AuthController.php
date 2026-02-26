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

    public function login(Request $request)
    {
        // Validasi Input
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Panggil Service
        $result = $this->authService->attemptLogin(
            $credentials, 
            $request->ip(), 
            $request->userAgent()
        );

        // Response
        return response()->json([
            'token' => $result['token'],
            'user'  => new LoginResource($result['user'])
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Berhasil logout']);
    }
}