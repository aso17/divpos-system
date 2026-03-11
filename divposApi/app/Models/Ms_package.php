<?php

namespace App\Models;

use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ms_package extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Ms_packages';

    protected $fillable = [
        'tenant_id',
        'service_id',
        'category_id',
        'unit_id',
        'code',
        'name',
        'description',
        'price',
        'discount_type',
        'discount_value',
        'final_price',
        'duration_menit',
        'is_weight_based',
        'min_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'final_price' => 'decimal:2',
        'min_order' => 'decimal:2',
        'duration_menit' => 'integer',
        'is_weight_based' => 'boolean',
        'is_active' => 'boolean',
        'tenant_id' => 'integer',
        'service_id' => 'integer',
        'category_id' => 'integer',
        'unit_id' => 'integer',
    ];

    /**
     * Boot function untuk menangani event secara otomatis
     */
    protected static function booted()
    {
        // Event saat record baru akan dibuat
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        // Event saat record akan diupdate
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Ms_unit::class, 'unit_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Ms_service::class, 'service_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Ms_category::class, 'category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'updated_by');
    }
}