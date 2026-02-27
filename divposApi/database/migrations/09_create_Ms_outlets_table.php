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
            $table->string('name', 150); // index di sini dihapus, dipindah ke komposit bawah
            $table->string('code', 50)->unique(); 
            
            // Contact & Location
            $table->string('phone', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            
            // Configuration & Status
            $table->boolean('is_active')->default(true); // index dihapus, dipindah ke komposit bawah
            $table->boolean('is_main_branch')->default(false);
            
            // Audit Trail
            $table->string('created_by', 100)->nullable();
            $table->string('updated_by', 100)->nullable();

            $table->timestampsTz();
            $table->softDeletesTz();

            // --- PERBAIKAN: Index Komposit untuk Performa ---
            // Ini akan mempercepat query saat mencari outlet aktif dalam satu tenant
            $table->index(['tenant_id', 'is_active', 'name'], 'idx_outlet_tenant_active_name');
            // ------------------------------------------------
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