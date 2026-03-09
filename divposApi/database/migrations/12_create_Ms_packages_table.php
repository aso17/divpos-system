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
        Schema::create('Ms_packages', function (Blueprint $table) {
            $table->id();
            
            // --- RELASI (Foreign Keys) ---
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('Ms_services')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('Ms_categories')->onDelete('cascade');
            
            // --- DATA UTAMA ---
            $table->string('code', 20);      
            $table->string('name', 100); 
            $table->string('description', 200)->nullable();
            
            // --- SKEMA HARGA (Performance Optimized) ---
            $table->decimal('price', 12, 2);
            $table->enum('discount_type', ['fixed', 'percentage', 'none'])->default('none');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->decimal('final_price', 12, 2); // Kolom hasil kalkulasi
            
            // --- OPERASIONAL ---
          
            $table->integer('duration_menit')->default(0)->comment('Durasi pengerjaan dalam menit');
            $table->string('unit', 10); 
            $table->boolean('is_weight_based')->default(false);
            $table->decimal('min_order', 8, 2)->default(1.00);
            $table->boolean('is_active')->default(true);
            
            // --- AUDIT TRAIL ---
            $table->foreignId('created_by')->nullable()->constrained('Ms_users');
            $table->foreignId('updated_by')->nullable()->constrained('Ms_users');
            $table->timestampsTz();
            $table->softDeletesTz();

            // ============================================================
            // PERFORMA & INDEXING STRATEGY
            // ============================================================

            // 1. UNIQUE: Mencegah kode ganda di satu tenant (Data Integrity)
            $table->unique(['tenant_id', 'code'], 'idx_pkg_tenant_code_unique');

            // 2. COMPOSITE INDEX: Untuk mempercepat Load Menu POS/Kasir
            // Query: SELECT * FROM Ms_packages WHERE tenant_id = ? AND category_id = ? AND is_active = 1
            $table->index(['tenant_id', 'category_id', 'is_active'], 'idx_pkg_listing_pos');

            // 3. SEARCH INDEX: Untuk fitur pencarian nama paket di UI React
            // Query: WHERE name LIKE ? AND tenant_id = ?
            $table->index(['tenant_id', 'name'], 'idx_pkg_search_name');

            // 4. PRICE RANGE INDEX: Untuk filter "Cari paket harga 20rb - 50rb"
            // Query: WHERE final_price BETWEEN ? AND ?
            $table->index(['tenant_id', 'final_price'], 'idx_pkg_price_range');

            // 5. DELETED AT INDEX: Mempercepat query SoftDeletes (Sangat penting jika data sudah jutaan)
            $table->index(['deleted_at'], 'idx_pkg_soft_deletes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_packages');
    }
};