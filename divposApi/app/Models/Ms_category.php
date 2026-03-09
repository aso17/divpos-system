<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class Ms_category extends Model
{
    use SoftDeletes;

    protected $table = 'Ms_categories';

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'priority',
        'is_active',
        'created_by',
        'updated_by'
    ];

    /**
     * Otomatisasi data saat event model berjalan
     */
    protected static function booted()
    {
        // Sebelum data dibuat (Create)
        static::creating(function ($model) {
            // 1. Paksa tenant_id sesuai user yang login
            if (Auth::check()) {
                $model->tenant_id = Auth::user()->tenant_id;
                $model->created_by = Auth::id();
            }

            // 2. Generate slug otomatis jika kosong
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->name);
            }
        });

        // Sebelum data diupdate (Update)
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }

            // Update slug jika nama berubah
            if ($model->isDirty('name')) {
                $model->slug = Str::slug($model->name);
            }
        });
    }

    // app/Models/Ms_category.php

    public function packages()
    {
        
        return $this->hasMany(Ms_package::class, 'category_id');
    }
    /**
     * Scope untuk mempermudah filter data milik tenant sendiri
     */
    public function scopeMyTenant($query)
    {
        return $query->where('tenant_id', Auth::user()->tenant_id);
    }

    /**
     * Relasi ke Creator (User)
     */
    public function creator()
    {
        return $this->belongsTo(Ms_User::class, 'created_by');
    }

    /**
     * Relasi ke Updater (User)
     */
    public function updater()
    {
        return $this->belongsTo(Ms_User::class, 'updated_by');
    }
}