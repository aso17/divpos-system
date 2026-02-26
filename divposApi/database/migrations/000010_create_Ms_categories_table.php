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
            $table->string('name', 50);
            $table->string('slug', 70)->nullable();      
            $table->unsignedSmallInteger('duration_hours')->comment('Durasi dalam jam');         
            $table->unsignedTinyInteger('priority')->default(0);            
            $table->boolean('is_active')->default(true);
            
            // Audit Trail Columns (disamakan dengan Ms_services)
            $table->string('created_by', 50)->nullable();
            $table->string('updated_by', 50)->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Unique per tenant agar tidak ada kategori ganda (misal 'Kilat' ada dua)
            $table->unique(['tenant_id', 'name'], 'idx_cat_tenant_name');
            // Unique slug per tenant juga penting jika dipakai di URL
            $table->unique(['tenant_id', 'slug'], 'idx_cat_tenant_slug');
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
