<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ms_role extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Ms_roles';

    

    protected $fillable = [
        'tenant_id', 
        'role_name',
        'code',
        'description',
        'is_active',
    ];

public function tenant()
{
    return $this->belongsTo(Ms_tenant::class, 'tenant_id');
}

    // Mengatur format data saat dikirim ke Frontend (React)
    protected $casts = [
        'is_active'  => 'boolean',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
        'deleted_at' => 'datetime:Y-m-d H:i:s',
    ];

    /**
     * Relasi: Satu Role bisa dipakai oleh banyak User.
     */
    public function users(): HasMany
    {
        return $this->hasMany(Ms_user::class, 'role_id');
    }

    /**
     * Relasi: Satu Role memiliki banyak Permission (Hak akses menu/modul).
     * Ini yang akan kita gunakan untuk setting module di React nanti.
     */
    public function permissions(): HasMany
    {
        return $this->hasMany(Ms_role_menu_permission::class, 'role_id');
    }
}