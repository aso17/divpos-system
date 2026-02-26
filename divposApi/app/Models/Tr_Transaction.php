<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tr_Transaction extends Model
{
    use SoftDeletes;

    protected $table = 'Tr_transactions';
    const STATUS_PENDING = 'PENDING';
    const STATUS_PROCESS = 'PROCESS';
    const STATUS_READY   = 'READY';
    const STATUS_TAKEN   = 'TAKEN';
    const STATUS_CANCELED = 'CANCELED';

    /**
     * White-listing kolom yang boleh diisi secara massal.
     * Ini menjamin hacker tidak bisa menyisipkan field 'id' atau field sensitif lainnya.
     */
    protected $fillable = [
        'tenant_id',
        'outlet_id',
        'invoice_no',
        'customer_id',
        'customer_name',
        'customer_phone',
        'order_date',
        'pickup_date',
        'actual_pickup_date',
        'total_base_price',
        'discount_amount',
        'tax_amount',
        'grand_total',
        'payment_method_id',
        'payment_amount',
        'change_amount',
        'total_paid',
        'status',
        'payment_status',
        'notes',
        'created_by',
        'updated_by',
    ];

    /**
     * Casting tipe data agar otomatis menjadi objek Carbon (untuk tanggal) 
     * atau numeric (untuk harga) saat diakses.
     */
    protected $casts = [
        'order_date' => 'datetime',
        'pickup_date' => 'datetime',
        'actual_pickup_date' => 'datetime',
        'total_base_price' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'total_paid' => 'decimal:2',
    ];

    // --- RELASI ---

    public function details(): HasMany
    {
        return $this->hasMany(Tr_TransactionDetail::class, 'transaction_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Tr_Payment::class, 'transaction_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(Tr_StatusLog::class, 'transaction_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Ms_Customer::class, 'customer_id');
    }
    
    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Ms_Outlet::class, 'outlet_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Ms_Tenant::class, 'tenant_id');
    }

    public function initialPaymentMethod(): BelongsTo
    {
        return $this->belongsTo(Ms_PaymentMethod::class, 'payment_method_id');
    }
}