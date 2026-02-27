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
       Schema::create('Ms_tenants', function (Blueprint $table) {
            $table->id();
            // Identity
            $table->string('name', 150);
            $table->string('slug', 150)->unique()->index(); 
            $table->string('code', 20)->unique(); 
            $table->string('domain', 150)->unique()->nullable(); 

            // --- TAMBAHAN: Relasi ke Master Jenis Bisnis ---
            // Ini yang krusial untuk performa query hybrid
            $table->foreignId('business_type_id')->after('name')->constrained('Ms_business_types');
            // ------------------------------------------------

            // Contact & Business
            $table->string('email', 100)->nullable(); 
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();

            // Branding
            $table->string('logo_path')->nullable();
            $table->string('primary_color', 7)->default('#059669'); 
            $table->string('theme', 20)->default('light');

            // Subscription & Status
            $table->boolean('is_active')->default(true)->index();
            // Default Tenant Flag
            $table->boolean('is_default')->default(false)->index();

            $table->timestamp('subscription_ends_at')->nullable(); 
        
            // Audit
            $table->string('created_by', 100)->nullable(); 
            $table->string('updated_by', 100)->nullable();

            $table->timestampsTz(); 
            $table->softDeletesTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_tenants');
    }
};