<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ms_tenant extends Model
{
    use SoftDeletes;

    protected $table = 'Ms_tenants';

    protected $fillable = [
        'business_type_id', // WAJIB (Laundry, Salon, dll)
        'owner_id',         // WAJIB (Siapa bosnya)
        'name',
        'slug',
        'code',
        'domain',
        'logo_path',
        'primary_color',
        'theme',
        'is_active',
        'is_default',
        'subscription_ends_at', // Buat kontrol akses SaaS
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'subscription_ends_at' => 'datetime', // Biar enak dibandingin saat login
    ];

    /* ==========================================================================
     |  Relationships
     ========================================================================== */

    // Relasi ke User (Owner Bisnis)
    public function owner(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'owner_id');
    }

    // Relasi ke Jenis Bisnis (Laundry, Salon, dll)
    public function businessType(): BelongsTo
    {
        return $this->belongsTo(Ms_business_type::class, 'business_type_id');
    }

    // Relasi ke Cabang/Outlet
    public function outlets(): HasMany
    {
        return $this->hasMany(Ms_outlet::class, 'tenant_id');
    }

    public function configs(): HasMany
    {
        return $this->hasMany(TenantConfig::class, 'tenant_id');
    }

    /* ==========================================================================
     |  Helpers & Logic
     ========================================================================== */

    // Cek apakah langganan masih aktif
    public function isSubscribed(): bool
    {
        return $this->is_active && ($this->subscription_ends_at === null || $this->subscription_ends_at->isFuture());
    }

    public function getConfig($key, $default = null)
    {
        // Gunakan eager loading 'configs' di controller agar baris ini tidak lemot
        $config = $this->configs->where('key', $key)->first();
        return $config ? $config->value : $default;
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'updated_by');
    }
}