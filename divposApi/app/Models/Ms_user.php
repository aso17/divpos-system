<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Auth;

class Ms_user extends Authenticatable
{
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
        'created_by', // Tambahkan ini agar bisa di-fill jika perlu
        'updated_by', // Tambahkan ini agar bisa di-fill jika perlu
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Agar is_owner otomatis muncul saat model di-convert ke Array/JSON
     */
    protected $appends = ['is_owner'];

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

    /**
     * Accessor is_owner
     */
    protected function isOwner(): Attribute
    {
        return Attribute::get(fn () => !is_null($this->tenant_id));
    }

    /**
     * Automate Audit Logs
     */
    protected static function booted()
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    /* --- RELATIONSHIPS --- */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'updated_by');
    }

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