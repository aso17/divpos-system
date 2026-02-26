<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ms_package extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Nama tabel didefinisikan eksplisit karena menggunakan PascalCase/Underscore
     */
    protected $table = 'Ms_packages';

    /**
     * Fillable dengan audit trail columns.
     * Kita batasi hanya kolom yang boleh diinput masal.
     */
    protected $fillable = [
        'tenant_id',
        'service_id',
        'category_id',
        'code',
        'name',
        'description',
        'price',
        'unit',
        'min_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * Type Casting untuk memastikan presisi data saat keluar dari Eloquent
     */
    protected $casts = [
        'price' => 'decimal:2',
        'min_order' => 'decimal:2',
        'is_active' => 'boolean',
        'tenant_id' => 'integer',
        'service_id' => 'integer',
        'category_id' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONS (Integritas Data)
    |--------------------------------------------------------------------------
    */

    /**
     * Relasi ke Tenant
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    /**
     * Relasi ke Service (Jasa)
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Ms_service::class, 'service_id');
    }

    /**
     * Relasi ke Category (Durasi/Kategori)
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Ms_category::class, 'category_id');
    }
}