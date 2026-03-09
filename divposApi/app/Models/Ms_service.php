<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Auth;

class Ms_service extends Model
{
    use HasFactory, SoftDeletes;

    // Definisikan nama tabel secara eksplisit karena ada huruf kapital (Ms_services)
    protected $table = 'Ms_services';

    /**
     * Kolom yang dapat diisi melalui mass assignment.
     */
        protected $fillable = [
            'tenant_id',
            'name',
            'description',
            'is_active',
            'created_by',
            'updated_by'
        ];
    /**
     * Casting data agar tipe data otomatis terkonversi saat diakses.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke Tenant.
     * Setiap layanan dimiliki oleh satu tenant.
     */

    public function creator(): BelongsTo
    {
        // Sesuaikan 'Ms_user::class' dengan nama model User Mas
        return $this->belongsTo(Ms_user::class, 'created_by');
    }

    /**
     * Relasi ke User yang mengubah layanan.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'updated_by');
    }

    
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    protected static function booted()
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                
                $model->created_by = Auth::id(); 
              
                $model->tenant_id = Auth::user()->employee?->tenant_id;
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
               
                $model->updated_by = Auth::id();
            }
        });
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}