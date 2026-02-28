<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserRefreshToken extends Model
{
    use HasFactory;

    protected $table = 'User_refresh_tokens'; // pastikan sesuai migration

    protected $fillable = [
        'user_id',
        'token',
        'device_name',
        'ip_address',
        'user_agent',
        'expires_at',
        'revoked_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATION
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(Ms_user::class, 'user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isRevoked(): bool
    {
        return !is_null($this->revoked_at);
    }

    public function isActive(): bool
    {
        return !$this->isExpired() && !$this->isRevoked();
    }
}