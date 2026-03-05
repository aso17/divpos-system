<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('Ms_outlets', function (Blueprint $table) {
            $table->id();           
            $table->foreignId('tenant_id')
                  ->constrained('Ms_tenants')
                  ->onDelete('cascade'); 

            // Identity Outlet
            $table->string('name', 150);
            $table->string('code', 50); // Unik per Tenant (lihat Unique Constraint di bawah)
            
            // Contact & Location
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->text('description')->nullable(); 
            
            // Configuration & Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_main_branch')->default(false);
            
            // Audit Trail (Enterprise Standard: Menggunakan ID User)
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();

            // Timestamps dengan Timezone (Penting untuk akurasi data antar wilayah)
            $table->timestampsTz();
            $table->softDeletesTz();

            // --- 1. UNIQUE CONSTRAINT PER TENANT ---
            // Kode outlet boleh sama antar tenant, tapi harus unik di dalam satu tenant.
            $table->unique(['tenant_id', 'code'], 'uk_outlet_tenant_code');

            // --- 2. INDEX KOMPOSIT UNTUK PERFORMA ---
            // Mempercepat List Outlet saat difilter Aktif & Nama di React
            $table->index(['tenant_id', 'is_active', 'name'], 'idx_outlet_tenant_active_name');
            
            // Mempercepat pengecekan cabang utama saat transaksi atau login
            $table->index(['tenant_id', 'is_main_branch'], 'idx_outlet_main_branch');

            // --- 3. FOREIGN KEYS UNTUK AUDIT TRAIL ---
            $table->foreign('created_by')->references('id')->on('Ms_users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('Ms_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_outlets');
    }
};