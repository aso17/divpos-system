<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ms_role_menu_permission extends Model
{
    use HasFactory;

    protected $table = 'Ms_role_menu_permissions';

    protected $fillable = [
        'tenant_id',
        'role_id',
        'module_id',
        'menu_id',
        'can_view',
        'can_create',
        'can_update',
        'can_delete',
        'can_export',
        'is_active',
        'created_by',
    ];

    // Penting agar React JS menerima true/false murni
    protected $casts = [
        'can_view'   => 'boolean',
        'can_create' => 'boolean',
        'can_update' => 'boolean',
        'can_delete' => 'boolean',
        'can_export' => 'boolean',
        'is_active'  => 'boolean',
    ];

    /**
     * Relasi balik ke Role
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Ms_role::class, 'role_id');
    }

    /**
     * Relasi ke Menu (untuk ambil nama menu & icon di UI React)
     */
    public function menu(): BelongsTo
    {
        return $this->belongsTo(Ms_menu::class, 'menu_id');
    }

    /**
     * Relasi ke Modul
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Ms_module::class, 'module_id');
    }
}