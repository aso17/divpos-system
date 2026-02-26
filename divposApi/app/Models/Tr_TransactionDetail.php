<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tr_TransactionDetail extends Model
{
    use SoftDeletes;

    protected $table = 'Tr_transaction_details';

    /**
     * White-listing kolom untuk keamanan Mass Assignment.
     * Kita masukkan semua kolom sesuai migrasi agar logic Service bisa
     * menyimpan array data secara kolektif.
     */
    protected $fillable = [
        'tenant_id',
        'transaction_id',
        'package_id',
        'package_name',
        'qty',
        'unit',
        'price_per_unit',
        'discount_per_unit',
        'subtotal',
        'notes',
    ];

    /**
     * Casting tipe data decimal agar tetap akurat (tidak menjadi string)
     * saat dikirim ke Frontend.
     */
    protected $casts = [
        'qty' => 'decimal:2',
        'price_per_unit' => 'decimal:2',
        'discount_per_unit' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    // --- RELASI ---

    /**
     * Menghubungkan detail kembali ke Header transaksi.
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Tr_Transaction::class, 'transaction_id');
    }

    /**
     * Menghubungkan ke Master Paket (jika masih ada).
     */
    public function package(): BelongsTo
    {
        return $this->belongsTo(Ms_Package::class, 'package_id');
    }

    /**
     * Menghubungkan ke Tenant.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_Tenant::class, 'tenant_id');
    }
}