<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

class Ms_role extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Ms_roles';

    protected $fillable = [
        'tenant_id', 
        'role_name',
        'code',
        'description',
        'is_active',
        'created_by',
        'updated_by', 
    ];

    protected static function boot()
    {
        parent::boot();

        // Saat data sedang dibuat (creating)
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::user()->id;
                $model->updated_by = Auth::user()->id;
            }
        });

        // Saat data sedang diupdate (updating)
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::user()->id;
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    protected $casts = [
        'is_active'  => 'boolean',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'deleted_at' => 'datetime:Y-m-d H:i:s',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(Ms_user::class, 'role_id');
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(Ms_role_menu_permission::class, 'role_id');
    }
}