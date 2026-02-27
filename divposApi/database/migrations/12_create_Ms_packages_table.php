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
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('Ms_services')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('Ms_categories')->onDelete('cascade');
            $table->string('code', 20);      

            $table->string('name', 100); 
            
            $table->string('description', 200)->nullable();
            
            $table->decimal('price', 12, 2);
            
            // Tambahkan estimasi durasi dalam menit
            $table->integer('duration_minutes')->default(0)->comment('Estimasi pengerjaan dalam menit');
            
            $table->string('unit', 10); 
            
            // Tambahkan flag apakah harga berdasarkan berat (kg) atau satuan/layanan
            $table->boolean('is_weight_based')->default(false)->comment('true=kiloan, false=satuan');

            $table->decimal('min_order', 5, 2)->default(1.00);
            
            $table->boolean('is_active')->default(true);
            
            // Audit Trail Columns
            $table->string('created_by', 50)->nullable();
            $table->string('updated_by', 50)->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            // Constraints & Indexing
            $table->unique(['tenant_id', 'code'], 'idx_pkg_tenant_code');
            
            // --- PERBAIKAN: Index untuk Performa ---
            // Index komposit untuk query cepat berdasarkan tenant, kategori, dan status aktif
            $table->index(['tenant_id', 'category_id', 'is_active'], 'idx_pkg_tenant_cat_active');
            
            // Mencegah kombinasi Service + Kategori yang sama di satu tenant
            $table->unique(['tenant_id', 'service_id', 'category_id'], 'idx_pkg_composite');
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