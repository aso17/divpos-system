<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ms_unit extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'Ms_units';

    protected $fillable = [
        'tenant_id',   // Null jika global, isi ID jika custom per tenant
        'name',        // Kilogram, Potong, Sesi
        'short_name',  // Kg, Pcs, Sesi
        'is_decimal',  // TRUE untuk Kg/Liter, FALSE untuk Pcs/Sesi
        'is_active',
    ];

    protected $casts = [
        'is_decimal' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relasi ke Paket
    public function packages()
    {
        return $this->hasMany(Ms_package::class, 'unit_id');
    }
}