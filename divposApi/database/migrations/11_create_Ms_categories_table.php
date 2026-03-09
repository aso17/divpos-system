<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Tambahkan ini

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('Ms_categories', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke Tenant
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            
            $table->string('name', 100); 
            $table->string('slug', 150)->nullable();
            
            $table->unsignedTinyInteger('priority')->default(0);            
            $table->boolean('is_active')->default(true);
            
            // Audit Columns
            $table->foreignId('created_by')->nullable()->constrained('Ms_users');
            $table->foreignId('updated_by')->nullable()->constrained('Ms_users');
            
            $table->timestampsTz(); 
            $table->softDeletesTz();

            // Index standar tetap bisa pakai Blueprint
            $table->index(['tenant_id', 'is_active'], 'idx_cat_tenant_active');
        });

        // GUNAKAN RAW SQL UNTUK POSTGRESQL PARTIAL UNIQUE INDEX
        // Ini kuncinya: Index hanya berlaku untuk data yang belum dihapus (deleted_at IS NULL)
        DB::statement('CREATE UNIQUE INDEX idx_cat_tenant_name ON "Ms_categories" (tenant_id, name) WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX idx_cat_tenant_slug ON "Ms_categories" (tenant_id, slug) WHERE deleted_at IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_categories');
    }
};