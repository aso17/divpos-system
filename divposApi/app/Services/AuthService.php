<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Models\UserRefreshToken;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class AuthService
{
    protected $userRepo;

    public function __construct(UserRepository $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    public function attemptLogin(array $credentials, string $ip, string $userAgent)
    {
        $throttleKey = Str::lower($credentials['email']) . '|' . $ip;

        // 🔒 Rate Limit
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'message' => ["Terlalu banyak percobaan. Coba lagi dalam $seconds detik."]
            ]);
        }

        $user = $this->userRepo->findActiveUserByEmail($credentials['email']);

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                'message' => ['Email atau password salah.']
            ]);
        }

        RateLimiter::clear($throttleKey);

        $this->userRepo->updateLoginInfo($user, $ip);

        return DB::transaction(function () use ($user, $ip, $userAgent) {

            // 🔐 Access Token (Sanctum)
            $accessToken = $user->createToken($userAgent ?: 'web-device')->plainTextToken;

            // 🔁 Refresh Token
            $plainRefreshToken = Str::random(64);

            UserRefreshToken::create([
                'user_id'     => $user->id,
                'token'       => hash('sha256', $plainRefreshToken),
                'device_name' => $userAgent ?: 'web-device',
                'ip_address'  => $ip,
                'user_agent'  => $userAgent,
                'expires_at'  => now()->addDays(7),
            ]);

            return [
                'user'          => $user,
                'token'         => $accessToken,
                'refresh_token' => $plainRefreshToken,
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH TOKEN
    |--------------------------------------------------------------------------
    */

    public function refreshToken(string $refreshToken, string $ip, string $userAgent)
    {
        $hashed = hash('sha256', $refreshToken);

        $tokenRecord = UserRefreshToken::where('token', $hashed)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$tokenRecord) {
            throw ValidationException::withMessages([
                'message' => ['Refresh token tidak valid atau expired.']
            ]);
        }

        $user = $tokenRecord->user;

        return DB::transaction(function () use ($user, $tokenRecord, $ip, $userAgent) {

            // 🧹 Optional: hapus semua access token lama
            $user->tokens()->delete();

            // 🔐 Generate access token baru
            $newAccessToken = $user->createToken($userAgent ?: 'web-device')->plainTextToken;

            // 🔁 Rotate refresh token (Security Best Practice)
            $newPlainRefreshToken = Str::random(64);

            $tokenRecord->update([
                'token'      => hash('sha256', $newPlainRefreshToken),
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'expires_at' => now()->addDays(7),
            ]);

            return [
                'token'         => $newAccessToken,
                'refresh_token' => $newPlainRefreshToken,
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT (PER DEVICE)
    |--------------------------------------------------------------------------
    */

    public function logout($user, string $refreshToken)
    {
        $hashed = hash('sha256', $refreshToken);

        DB::transaction(function () use ($user, $hashed) {

            // Hapus access token aktif
            $user->currentAccessToken()?->delete();

            // Revoke refresh token device ini saja
            UserRefreshToken::where('user_id', $user->id)
                ->where('token', $hashed)
                ->whereNull('revoked_at')
                ->update([
                    'revoked_at' => now()
                ]);
        });
    }
}