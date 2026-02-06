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
        Schema::create('Ms_services', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');       
            $table->string('name', 100);        
            $table->string('description', 200)->nullable(); 
            $table->boolean('is_active')->default(true);                 
            $table->string('created_by', 50)->nullable();
            $table->string('updated_by', 50)->nullable();
            
            $table->timestamps(); 
            $table->softDeletes(); 
            
            // Index untuk optimasi pencarian nama dan keamanan data per tenant
            $table->unique(['tenant_id', 'name'], 'idx_service_tenant_name');
        });
    }

   
    public function down(): void
    {
        Schema::dropIfExists('Ms_services');
    }
};
