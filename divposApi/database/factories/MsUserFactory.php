<?php

namespace Database\Factories;

use App\Models\Ms_user;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MsUserFactory extends Factory
{
    // Hubungkan factory ini ke model Ms_user
    protected $model = Ms_user::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'full_name'     => fake()->name(),
            'email'         => fake()->unique()->safeEmail(),
            'username'      => fake()->unique()->userName(),
            'phone'         => fake()->phoneNumber(),
            'avatar'        => null,
            'password'      => static::$password ??= Hash::make('password'),
            'is_active'     => true,
            'role_id'       => 2, // Sesuaikan dengan ID Role (misal: ADMIN/KASIR)
            'tenant_id'     => 1, // Sesuaikan dengan ID Tenant yang ada
            'last_login_at' => null,
            'last_login_ip' => null,
        ];
    }
}