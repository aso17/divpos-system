<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ms_outlet extends Model
{
    use HasFactory, SoftDeletes;

    // Karena nama tabel tidak jamak (plural), kita definisikan manual
    protected $table = 'Ms_outlets';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'phone',
        'email',
        'address',
        'city',
        'is_active',
        'is_main_branch',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'is_main_branch' => 'boolean',
        'subscription_ends_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relasi ke Tenant (Owner dari Outlet ini)
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    /**
     * Scope untuk mempermudah filter per tenant (Multitenancy)
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope untuk hanya mengambil outlet yang aktif
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}