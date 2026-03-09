<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Ms_employee extends Model
{
    use HasFactory, SoftDeletes;

    // Tentukan nama tabel secara eksplisit karena tidak mengikuti standar (pake Ms_)
    protected $table = 'Ms_employees';

    // Field yang boleh diisi secara massal (Mass Assignment)
    protected $fillable = [
        'user_id',
        'tenant_id',
        'outlet_id',
        'employee_code',
        'full_name',
        'phone',
        'job_title',
        'is_active',
        'year',
        'created_by',
        'updated_by',   
    ];

    
    // Casting untuk tipe data tertentu
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'year' => 'integer',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        ];
        
    protected $dateFormat = 'Y-m-d H:i:sO';
    // --- RELASI ---

    // Karyawan memiliki satu user (login)
    public function user()
    {
        return $this->belongsTo(Ms_user::class, 'user_id');
    }

    // Karyawan terdaftar di satu tenant
    public function tenant()
    {
        return $this->belongsTo(Ms_tenant::class, 'tenant_id');
    }

    // Karyawan bekerja di satu outlet (bisa null jika pusat)
    public function outlet()
    {
        return $this->belongsTo(Ms_outlet::class, 'outlet_id');
    }


      protected static function booted()
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                // Isi dengan ID User (Integer)
                $model->created_by = Auth::id(); 
                // Ambil tenant_id dari relasi employee
                $model->tenant_id = Auth::user()->employee?->tenant_id;
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                // Isi dengan ID User (Integer)
                $model->updated_by = Auth::id();
            }
        });
    }
}