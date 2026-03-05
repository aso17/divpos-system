<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class Ms_outlet extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Ms_outlets';

    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'phone',
        'address',
        'city',
        'description',
        'is_active',
        'is_main_branch',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tenant_id'      => 'integer', 
        'is_active'      => 'boolean',
        'is_main_branch' => 'boolean',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
        'deleted_at'     => 'datetime',
        'created_by'     => 'integer',
        'updated_by'     => 'integer',
    ];

    /**
     * Security: Hindari data mentah ini bocor ke response API secara tidak sengaja
     */
    protected $hidden = [
        'deleted_at',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (Auth::check()) { 
                $model->created_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                // Performa: Hanya update field updated_by jika ada data yang berubah
                if ($model->isDirty()) {
                    $model->updated_by = Auth::id();
                }
            }
        });
    }

    // --- RELATIONS ---

    public function tenant(): BelongsTo
    {
        // Gunakan FK yang spesifik jika Ms_tenant menggunakan 'id'
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'updated_by');
    }

    // --- SCOPES (Logic & Performance) ---

    /**
     * Scope untuk efisiensi query multi-tenant
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeMain($query)
    {
        return $query->where('is_main_branch', true);
    }
}