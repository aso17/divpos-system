<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ms_PaymentMethod extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Nama tabel yang didefinisikan secara eksplisit.
     * Menggunakan PascalCase sesuai dengan skema migration.
     */
    protected $table = 'Ms_payment_methods';

    /**
     * Atribut yang dapat diisi (mass assignable).
     */
    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'account_number',
        'account_name',
        'description',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * Casting tipe data kolom.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relasi ke Tenant.
     */
    public function tenant()
    {
        return $this->belongsTo(Ms_Tenant::class, 'tenant_id');
    }
}