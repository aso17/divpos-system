<?php
namespace App\Http\Controllers;
use App\Models\Ms_user;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;

class AuthController extends Controller
{
   public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

       $user = Ms_user::select(
            'id',
            'full_name',
            'email',
            'password',
            'role_id',
            'tenant_id'
            ) 
            ->with([
                    'tenant:id,slug,logo_path'
                ])
            ->where('email', $request->email)
            ->where('is_active', true)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'message' => ['Invalid email or password'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'        => $user->id,
                'full_name' => $user->full_name,
                'email'     => $user->email,
                'role_id'   => $user->role_id,
                'tenant_id' => $user->tenant_id,
                'tenant' => [
                    'slug' => $user->tenant->slug ?? null,
                     'logo_path'      => $user->tenant->logo_path
                        ? asset("storage/{$user->tenant->logo_path}")
                        : null,
                ],
            ],
        ]);

    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

}
