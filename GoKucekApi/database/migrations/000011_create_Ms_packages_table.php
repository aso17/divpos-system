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
        
        $table->string('unit', 10); 
        
        $table->decimal('min_order', 5, 2)->default(1.00);
        
        $table->boolean('is_active')->default(true);
        
        // Audit Trail Columns
        $table->string('created_by', 50)->nullable();
        $table->string('updated_by', 50)->nullable();
        
        $table->timestamps();
        $table->softDeletes();

        // Constraints & Indexing
        $table->unique(['tenant_id', 'code'], 'idx_pkg_tenant_code');
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
