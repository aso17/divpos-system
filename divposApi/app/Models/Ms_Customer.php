<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class Ms_Customer extends Model
{
    use SoftDeletes;

    protected $table = 'Ms_customers';

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'email',
        'address',
        'gender',
        'point',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'point' => 'decimal:2',
    ];

    /**
     * AUTO FILL created_by & updated_by
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

    // --- RELASI ---

    public function transactions(): HasMany
    {
        return $this->hasMany(Tr_Transaction::class, 'customer_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_Tenant::class, 'tenant_id');
    }
}