<?php
namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class AuthService
{
    protected $userRepo;

    public function __construct(UserRepository $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    public function attemptLogin(array $credentials, string $ip, string $userAgent)
    {
        $throttleKey = Str::lower($credentials['email']) . '|' . $ip;

        // 1. Rate Limiting Check
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'message' => ["Terlalu banyak percobaan. Coba lagi dalam $seconds detik."],
            ]);
        }

        // 2. Cari User via Repo
        $user = $this->userRepo->findActiveUserByEmail($credentials['email']);

        // 3. Verifikasi Password
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages([
                'message' => ['Email atau password salah.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        // 4. Update Log Login via Repo
        $this->userRepo->updateLoginInfo($user, $ip);

        // 5. Generate Token
        $token = $user->createToken($userAgent ?: 'web-device')->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token
        ];
    }
}