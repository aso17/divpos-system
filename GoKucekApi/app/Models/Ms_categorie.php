<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Ms_category extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Ms_categories';

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'duration_hours',
        'priority',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tenant_id' => 'integer',
        'duration_hours' => 'integer',
        'priority' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Boot function untuk logic otomatis
     */
    protected static function boot()
    {
        parent::boot();

        // Otomatis membuat slug saat creating/updating jika nama berubah
        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Relasi ke Tenant (Owner data)
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    /**
     * Relasi ke Packages (Mencegah Orphan Data saat Delete)
     */
    public function packages(): HasMany
    {
        return $this->hasMany(Ms_package::class, 'category_id');
    }
}