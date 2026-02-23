<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tr_Payment extends Model
{
    use SoftDeletes;

    protected $table = 'Tr_payments';

    /**
     * White-listing kolom untuk keamanan Mass Assignment.
     * Sangat krusial karena ini menyangkut data nominal uang (amount).
     */
    protected $fillable = [
        'tenant_id',
        'transaction_id',
        'payment_method_id',
        'amount',
        'payment_date',
        'reference_no',
        'paid_by',
        'received_by',
        'notes',
    ];

    /**
     * Casting tipe data.
     */
    protected $casts = [
        'payment_date' => 'datetime',
        'amount' => 'decimal:2',
    ];

    // --- RELASI ---

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Tr_Transaction::class, 'transaction_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(Ms_PaymentMethod::class, 'payment_method_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_Tenant::class, 'tenant_id');
    }
}