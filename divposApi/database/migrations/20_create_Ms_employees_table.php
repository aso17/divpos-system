<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ms_employees', function (Blueprint $table) {
            $table->id();          
            
            // Relasi ke User (1-to-1 relasi)
            $table->foreignId('user_id')
                  ->nullable() 
                  ->unique()
                  ->constrained('Ms_users')
                  ->nullOnDelete(); 
      
            // Relasi ke Tenant (Wajib)
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->cascadeOnDelete();
            
            // Relasi ke Outlet (Nullable untuk Owner/Manager Area)
            $table->foreignId('outlet_id')->nullable()->constrained('Ms_outlets')->nullOnDelete();
            
            // Kode unik karyawan (Gunakan index untuk pencarian cepat)
            $table->string('employee_code', 20)->unique();
            
            // Profil
            $table->string('full_name', 100);
            $table->string('phone', 20)->nullable();
            $table->string('job_title', 50)->nullable();
            
            // Status (Gunakan index untuk filter operasional)
            $table->boolean('is_active')->default(true)->index();
            
            // Audit - Gunakan Tz agar seragam dengan tabel lainnya
            $table->timestampsTz();
            $table->softDeletesTz();

            /* -------------------------------------------------------------------------- */
            /* INDEXING UNTUK PERFORMANCE 100K DATA                                      */
            /* -------------------------------------------------------------------------- */
            
            // Index yang Mas buat sudah benar, tapi tambahkan urutan yang paling sering di-query
            $table->index(['tenant_id', 'outlet_id', 'is_active'], 'idx_emp_operational');
            
            // Index tambahan jika Mas sering mencari karyawan berdasarkan nama di dashboard
            $table->index('full_name', 'idx_emp_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_employees');
    }
};