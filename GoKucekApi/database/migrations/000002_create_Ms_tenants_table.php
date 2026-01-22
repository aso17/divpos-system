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

            // Contact & Business (Tambahan Penting)
            $table->string('email', 100)->nullable(); 
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();

            // Branding
            $table->string('logo_path')->nullable();
            $table->string('primary_color', 7)->default('#2563EB'); 
            $table->string('theme', 20)->default('light');

            // Subscription & Status (Kritis untuk SaaS)
            $table->boolean('is_active')->default(true)->index();
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
