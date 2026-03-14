<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ms_PaymentMethod extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Ms_payment_methods';

    /**
     * Tambahkan kolom-kolom logic baru ke dalam fillable
     */
    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'account_number',
        'account_name',
        'description',
        'is_active',
        'is_cash',         // Tambahkan ini
        'is_dp_enabled',   // Tambahkan ini
        'allow_zero_pay',  // Tambahkan ini
        'created_by',
        'updated_by',
    ];

    /**
     * Casting tipe data agar Laravel membacanya sebagai Boolean (True/False)
     */
    protected $casts = [
        'is_active'      => 'boolean',
        'is_cash'        => 'boolean', // Pastikan dicast ke boolean
        'is_dp_enabled'  => 'boolean', // Pastikan dicast ke boolean
        'allow_zero_pay' => 'boolean', // Pastikan dicast ke boolean
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
        'deleted_at'     => 'datetime',
    ];

    /**
     * Relasi ke Tenant.
     */
    public function tenant()
    {
        return $this->belongsTo(Ms_Tenant::class, 'tenant_id');
    }
}