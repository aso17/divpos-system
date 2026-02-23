<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tr_StatusLog extends Model
{
    protected $table = 'Tr_status_logs';

    /**
     * White-listing kolom untuk keamanan Mass Assignment.
     * Kita daftarkan semua kolom yang diperlukan untuk mencatat sejarah perubahan status.
     */
    protected $fillable = [
        'tenant_id',
        'transaction_id',
        'status',
        'changed_by',
        'notes',
        'description',
    ];

    /**
     * Secara default, log status biasanya tidak memerlukan fitur update (imutabel).
     * Namun kita tetap biarkan standar timestamps Laravel bekerja.
     */

    // --- RELASI ---

    /**
     * Menghubungkan log kembali ke transaksi induknya.
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Tr_Transaction::class, 'transaction_id');
    }

    /**
     * Menghubungkan log ke Tenant terkait.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_Tenant::class, 'tenant_id');
    }
}