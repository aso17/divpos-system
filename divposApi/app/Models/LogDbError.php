<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogDbError extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'Log_db_errors'; // Sesuaikan dengan nama tabel di migrasi

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'tenant_id',
        'error_code',
        'message',
        'sql_query',
        'bindings',
        'url',
        'ip_address',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'bindings' => 'array', // Casting otomatis json ke array
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that caused the error.
     */
    public function user()
    {
        return $this->belongsTo(Ms_user::class, 'user_id');
    }

    /**
     * Get the tenant associated with the error.
     */
    public function tenant()
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }
}