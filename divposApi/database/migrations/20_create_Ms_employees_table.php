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
            
            // Relasi ke User (Identitas Login) - Dibuat UNIQUE untuk 1-to-1
            $table->foreignId('user_id')->unique()->constrained('Ms_users')->cascadeOnDelete();
            
            // Relasi ke Tenant (Perusahaan)
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->cascadeOnDelete();
            
            // Relasi ke Outlet (nullable untuk Admin Global)
            $table->foreignId('outlet_id')->nullable()->constrained('Ms_outlets')->nullOnDelete();
            
            // Role/Jabatan Spesifik (String atau foreign key ke Ms_roles)
            $table->string('job_title', 50)->nullable();
            
            // Status Karyawan di Tenant tersebut
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            $table->softDeletes();

            // Index untuk mempercepat query laporan per tenant dan outlet
            $table->index(['tenant_id', 'outlet_id'], 'idx_employee_tenant_outlet');
            // user_id tidak perlu index terpisah karena sudah UNIQUE
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_employees');
    }
};