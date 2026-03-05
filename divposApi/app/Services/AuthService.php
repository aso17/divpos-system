<?php

namespace App\Services;

use App\Repositories\AuthRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class AuthService
{
    protected $authRepo;

    public function __construct(AuthRepository $authRepo)
    {
        $this->authRepo = $authRepo;
    }

    public function attemptLogin(array $credentials, string $ip, string $userAgent)
    {
        $throttleKey = Str::lower($credentials['email']) . '|' . $ip;

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'message' => ["Terlalu banyak percobaan. Coba lagi dalam $seconds detik."]
            ]);
        }

        $user = $this->authRepo->findForAuthentication($credentials['email']);

        // 1. Validasi Kredensial
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages(['message' => ['Email atau password salah.']]);
        }

        // 2. Validasi Status Aktif User & Tenant
        if (!$user->user_active) {
            throw ValidationException::withMessages(['message' => ['Akun Anda telah dinonaktifkan.']]);
        }

        if ($user->tenant_id && !$user->tenant_active) {
            throw ValidationException::withMessages(['message' => ['Layanan bisnis Anda sedang ditangguhkan.']]);
        }

        RateLimiter::clear($throttleKey);
        $this->authRepo->updateLoginMetadata($user->id, $ip);

        return DB::transaction(function () use ($user, $ip, $userAgent) {
            $accessToken = $user->createToken($userAgent ?: 'web-device')->plainTextToken;
            $plainRefreshToken = Str::random(64);

            $this->authRepo->storeRefreshToken([
                'user_id'     => $user->id,
                'plain_token' => $plainRefreshToken,
                'device_name' => Str::limit($userAgent, 255) ?: 'web-device',
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

    public function refreshToken(string $refreshToken, string $ip, string $userAgent)
    {
        $tokenRecord = $this->authRepo->findValidRefreshToken($refreshToken);

        if (!$tokenRecord || !$tokenRecord->user) {
            throw ValidationException::withMessages(['message' => ['Sesi tidak valid atau telah berakhir.']]);
        }

        $user = $tokenRecord->user;

        return DB::transaction(function () use ($user, $tokenRecord, $ip, $userAgent) {
            // Hapus token akses yang sekarang saja, agar device lain tidak ter-logout
            $user->currentAccessToken()?->delete();

            $newAccessToken = $user->createToken($userAgent ?: 'web-device')->plainTextToken;
            $newPlainRefreshToken = Str::random(64);

            // Rotate Token: Revoke yang lama, buat yang baru
            $tokenRecord->update(['revoked_at' => now()]);
            
            $this->authRepo->storeRefreshToken([
                'user_id'     => $user->id,
                'plain_token' => $newPlainRefreshToken,
                'device_name' => Str::limit($userAgent, 255) ?: 'web-device',
                'ip_address'  => $ip,
                'user_agent'  => $userAgent,
                'expires_at'  => now()->addDays(7),
            ]);

            return [
                'token'         => $newAccessToken,
                'refresh_token' => $newPlainRefreshToken,
            ];
        });
    }

    public function logout($user, string $refreshToken)
    {
        DB::transaction(function () use ($user, $refreshToken) {
            $user->currentAccessToken()?->delete();
            $this->authRepo->revokeRefreshToken($user->id, $refreshToken);
        });
    }
}