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
            $table->foreignId('user_id')
                  ->nullable() 
                  ->unique()
                  ->constrained('Ms_users')
                  ->nullOnDelete(); 
      
            // Relasi ke Tenant (Wajib: Pemisah data antar bisnis LAUNDRY, SALON, dll)
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->cascadeOnDelete();
            
            // Relasi ke Outlet (Nullable: Untuk posisi manager yang pegang banyak outlet)
            $table->foreignId('outlet_id')->nullable()->constrained('Ms_outlets')->nullOnDelete();
            
            // 🎯 PENANDA TAHUN: Untuk optimasi generate kode (Point Seek)
            $table->unsignedSmallInteger('year');

            // KODE KARYAWAN: Kita hapus ->unique() global, ganti ke Composite Unique di bawah
            $table->string('employee_code', 20);
            
            // Profil
            $table->string('full_name', 100);
            $table->string('phone', 20)->nullable();
            $table->string('job_title', 50)->nullable();
            
            // Status Operasional
            $table->boolean('is_active')->default(true)->index();
            
            // Audit - Menggunakan Timezone (Tz) sesuai standar pgsql Mas
            $table->timestampsTz();
            $table->softDeletesTz();

            /* -------------------------------------------------------------------------- */
            /* INDEXING & CONSTRAINTS UNTUK SKALA BESAR                                   */
            /* -------------------------------------------------------------------------- */
            
            // 🛡️ MULTITENANT UNIQUE: Kode boleh sama antar Tenant, tapi wajib beda di satu Tenant
            $table->unique(['tenant_id', 'employee_code'], 'unique_emp_code_per_tenant');

            // 🚀 GENERATE CODE INDEX: Mencari kode terakhir berdasarkan Tahun & Tenant
            $table->index(['tenant_id', 'year', 'employee_code'], 'idx_emp_year_lookup');
            
            // 📊 OPERATIONAL INDEX: Untuk list karyawan di dashboard outlet
            $table->index(['tenant_id', 'outlet_id', 'is_active'], 'idx_emp_operational');
            
            // 🔍 SEARCH INDEX: Pencarian nama karyawan
            $table->index('full_name', 'idx_emp_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_employees');
    }
};