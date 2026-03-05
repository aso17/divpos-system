<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ms_business_type extends Model
{
    use HasFactory;

    protected $table = 'Ms_business_types';

    protected $fillable = [
        'name',
        'code',
        'slug',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /* ==========================================================================
     |  Relationships
     ========================================================================== */

    /**
     * Mendapatkan semua tenant yang terdaftar dalam jenis bisnis ini.
     * Contoh: Ambil semua toko yang jenisnya 'LAUNDRY'.
     */
    public function tenants(): HasMany
    {
        return $this->hasMany(Ms_tenant::class, 'business_type_id');
    }

    /* ==========================================================================
     |  Scopes (Untuk Query yang Lebih Bersih)
     ========================================================================== */

    /**
     * Scope untuk hanya mengambil jenis bisnis yang aktif.
     * Penggunaan: Ms_business_type::active()->get();
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}