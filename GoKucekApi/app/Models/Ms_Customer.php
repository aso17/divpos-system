<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ms_Customer extends Model
{
    use SoftDeletes;

    protected $table = 'Ms_customers';

    /**
     * Menggunakan $fillable untuk keamanan Mass Assignment.
     * Kolom 'point' didaftarkan agar bisa diupdate melalui Service, 
     * namun pastikan validasi di Controller ketat.
     */
    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'email',
        'address',
        'gender',
        'point',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * Casting data agar memudahkan manipulasi di sisi aplikasi.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'point' => 'decimal:2',
    ];

    // --- RELASI ---

    /**
     * Relasi: Satu pelanggan bisa memiliki banyak riwayat transaksi laundry.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Tr_Transaction::class, 'customer_id');
    }

    /**
     * Relasi: Pelanggan terikat pada satu Tenant tertentu.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_Tenant::class, 'tenant_id');
    }
}