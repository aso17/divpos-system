<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
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
    ];

    // Casting untuk tipe data tertentu
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

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
}