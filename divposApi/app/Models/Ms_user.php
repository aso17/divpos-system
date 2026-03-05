<?php

namespace App\Models;

// Pindahkan urutan use agar Authenticatable paling atas
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ms_user extends Authenticatable
{
    // Gunakan Trait yang dibutuhkan
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'Ms_users';

    protected $fillable = [
        'tenant_id',
        'role_id',
        'email',
        'username',
        'password',
        'full_name',
        'phone',
        'avatar',
        'is_active',
        'email_verified_at',
        'last_login_at',
        'last_login_ip',
        'locked_until',
        'login_attempts',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Laravel 11 style casting
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'locked_until'      => 'datetime',
            'is_active'         => 'boolean',
            'password'          => 'hashed', 
        ];
    }

    /* --- RELATIONSHIPS --- */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Ms_role::class, 'role_id');
    }
    
    public function employee(): HasOne
    {
        return $this->hasOne(Ms_employee::class, 'user_id');
    }

    public function refreshTokens(): HasMany
    {
        return $this->hasMany(UserRefreshToken::class, 'user_id');
    }
}