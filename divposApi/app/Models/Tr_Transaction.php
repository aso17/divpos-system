<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class Tr_Transaction extends Model
{
    use SoftDeletes;

    protected $table = 'Tr_transactions';

    // --- Konstanta Status (Source of Truth) ---
    const STATUS_PENDING   = 'PENDING';
    const STATUS_PROCESS   = 'PROCESS';
    const STATUS_READY     = 'READY';
    const STATUS_TAKEN     = 'TAKEN';
    const STATUS_CANCELED  = 'CANCELED';
    const STATUS_COMPLETED = 'COMPLETED'; 

    const PAY_UNPAID  = 'UNPAID';
    const PAY_PARTIAL = 'PARTIAL';
    const PAY_PAID    = 'PAID';

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
        'dp_amount',          // Penambahan: Untuk menampung uang muka
        'payment_method_id',
        'payment_amount',     // Uang fisik dari customer
        'change_amount',      // Kembalian
        'total_paid',         // Total bersih (DP + Payment - Change)
        'status',
        'payment_status',
        'notes',
        'order_year',    
        'order_month',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'order_date'         => 'datetime',
        'pickup_date'        => 'datetime',
        'actual_pickup_date' => 'datetime',
        'order_year'         => 'integer', // Tambahkan cast integer
        'order_month'        => 'integer',
        'total_base_price'   => 'float',
        'discount_amount'    => 'float',
        'tax_amount'         => 'float',
        'grand_total'        => 'float',
        'dp_amount'          => 'float', // Penambahan: Casting untuk akurasi math
        'payment_amount'     => 'float',
        'change_amount'      => 'float',
        'total_paid'         => 'float',
    ];

    /**
     * Boot logic untuk mengisi audit columns secara otomatis
     */
    protected static function booted()
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    // --- RELASI TRANSKASIONAL ---

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

    // --- RELASI MASTER DATA ---

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

    // --- RELASI AUDIT ---

    public function creator(): BelongsTo
    {
        // Sesuaikan nama model User anda, biasanya 'User' atau 'Ms_user'
        return $this->belongsTo(Ms_user::class, 'created_by'); 
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(Ms_user::class, 'updated_by');
    }
}