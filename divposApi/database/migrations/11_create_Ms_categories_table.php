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
        Schema::create('Ms_categories', function (Blueprint $table) {
        $table->id();
        $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
        $table->foreignId('business_type_id')->constrained('Ms_business_types'); // FK ke Tabel Baru
        $table->string('name', 50);
        $table->string('slug', 70)->nullable();
        
        // duration_hours dihapus
        
        $table->unsignedTinyInteger('priority')->default(0);            
        $table->boolean('is_active')->default(true);
        
        $table->string('created_by', 50)->nullable();
        $table->string('updated_by', 50)->nullable();
        
        $table->timestamps();
        $table->softDeletes();
        
        $table->unique(['tenant_id', 'name'], 'idx_cat_tenant_name');
        $table->unique(['tenant_id', 'slug'], 'idx_cat_tenant_slug');

        $table->index(['tenant_id', 'business_type_id', 'is_active'], 'idx_cat_tenant_type_active');
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_categories');
    }
};