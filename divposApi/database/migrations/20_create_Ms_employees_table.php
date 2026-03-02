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
            // Relasi ke User (Identitas Login) - Dibuat OPTIONAL (nullable)
            // Dibuat unique() untuk 1-to-1 relasi
            $table->foreignId('user_id')
                  ->nullable() // Karyawan tidak wajib punya login
                  ->unique()
                  ->constrained('Ms_users')
                  ->nullOnDelete(); // Jika user dihapus, user_id jadi NULL, data karyawan tetap ada
      
            // Relasi ke Tenant (Perusahaan)
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->cascadeOnDelete();
            
            // Relasi ke Outlet (nullable untuk Admin Global/Multi-outlet)
            $table->foreignId('outlet_id')->nullable()->constrained('Ms_outlets')->nullOnDelete();
            
            // Kode unik karyawan/NIK
            $table->string('employee_code', 20)->unique();
            
            // Data profil utama
            $table->string('full_name', 100);
            $table->string('phone', 20)->nullable();
            
            // Jabatan (Stylist, Barber, Washer, dll)
            $table->string('job_title', 50)->nullable();
            
            // Status Karyawan di Tenant tersebut
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            $table->softDeletes();

            // Index untuk mempercepat query laporan per tenant dan outlet
            $table->index(['tenant_id', 'outlet_id', 'is_active'], 'idx_employee_operational');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_employees');
    }
};