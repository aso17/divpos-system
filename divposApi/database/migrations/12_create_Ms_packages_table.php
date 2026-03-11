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
            
            // PERUBAHAN DISINI: Pakai unit_id, bukan string unit lagi
            $table->foreignId('unit_id')->constrained('Ms_units')->onDelete('restrict'); 
            
            // --- DATA UTAMA ---
            $table->string('code', 20);      
            $table->string('name', 100); 
            $table->string('description', 200)->nullable();
            
            // --- SKEMA HARGA ---
            $table->decimal('price', 12, 2);
            $table->enum('discount_type', ['fixed', 'percentage', 'none'])->default('none');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->decimal('final_price', 12, 2); 
            
            // --- OPERASIONAL ---
            $table->integer('duration_menit')->default(0)->comment('Hasil konversi Jam/Hari dari UI');
            
            // Tetap simpan flag ini untuk mempermudah query di POS tanpa perlu join terus-menerus
            $table->boolean('is_weight_based')->default(false)->comment('Denormalisasi dari Ms_units.is_decimal');
            
            $table->decimal('min_order', 8, 2)->default(1.00);
            $table->boolean('is_active')->default(true);
            
            // --- AUDIT TRAIL ---
            $table->foreignId('created_by')->nullable()->constrained('Ms_users');
            $table->foreignId('updated_by')->nullable()->constrained('Ms_users');
            $table->timestampsTz();
            $table->softDeletesTz();

            // --- INDEXING ---
            $table->unique(['tenant_id', 'code'], 'idx_pkg_tenant_code_unique');
            $table->index(['tenant_id', 'category_id', 'is_active'], 'idx_pkg_listing_pos');
            $table->index(['tenant_id', 'name'], 'idx_pkg_search_name');
            $table->index(['tenant_id', 'final_price'], 'idx_pkg_price_range');
            $table->index(['deleted_at'], 'idx_pkg_soft_deletes');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_packages');
    }
};