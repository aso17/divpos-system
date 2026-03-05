<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; 
use Illuminate\Database\Eloquent\SoftDeletes;

class Ms_user extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    protected $table = 'Ms_users';

    protected $fillable = [
        'tenant_id', // <--- TAMBAHKAN INI (Sangat Penting untuk SaaS)
        'role_id',
        'email',
        'username',
        'password',
        'full_name', // Opsional jika data utama ada di Ms_employee
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

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'locked_until'      => 'datetime', // Cast baru sesuai migrasi
            'is_active'         => 'boolean',
            'password'          => 'hashed', 
        ];
    }

    /* -------------------------------------------------------------------------- */
    /* RELATIONSHIPS (The Backbone of Your SaaS)                                  */
    /* -------------------------------------------------------------------------- */

    public function tenant()
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    public function role()
    {
        return $this->belongsTo(Ms_role::class, 'role_id');
    }
    
    public function employee() 
    {
        return $this->hasOne(Ms_employee::class, 'user_id');
    }

    public function refreshTokens()
    {
        return $this->hasMany(UserRefreshToken::class, 'user_id');
    }
}