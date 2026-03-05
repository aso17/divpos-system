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
            
            // --- Identity & Ownership ---
            $table->string('name', 150);
            $table->string('slug', 150)->unique(); // unique sudah otomatis membuat index
            $table->string('code', 20)->unique(); 
            $table->string('domain', 150)->unique()->nullable(); 

            // RELASI OWNER: Penanda siapa bos besarnya (Merujuk ke Tabel User)
            $table->foreignId('owner_id')
                  ->nullable() 
                  ->constrained('Ms_users')
                  ->onDelete('restrict');

            // Relasi ke Jenis Bisnis (LAUNDRY, SALON, dll)
            $table->foreignId('business_type_id')
                  ->constrained('Ms_business_types');

            // --- Contact & Business ---
            $table->string('email', 100)->nullable(); 
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();

            // --- Branding ---
            $table->string('logo_path')->nullable();
            $table->string('primary_color', 7)->default('#059669'); 
            $table->string('theme', 20)->default('light');

            // --- Subscription & Status ---
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestampTz('subscription_ends_at')->nullable(); 
        
            // --- Audit Trail ---
            // Menggunakan ForeignId agar bisa ditarik data User-nya (siapa yang buat/edit)
            $table->foreignId('created_by')->nullable()->constrained('Ms_users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('Ms_users')->nullOnDelete();

            $table->timestampsTz(); 
            $table->softDeletesTz();

            /* -------------------------------------------------------------------------- */
            /* INDEXING UNTUK PERFORMA                                     */
            /* -------------------------------------------------------------------------- */
            
            // Index untuk pencarian cepat berdasarkan status dan tipe bisnis
            $table->index(['is_active', 'business_type_id'], 'idx_tenant_status_type');
            
            // Index untuk pencarian berdasarkan pemilik (penting untuk dashboard admin)
            $table->index('owner_id', 'idx_tenant_owner');
            
            // Index untuk sorting berdasarkan waktu berlangganan
            $table->index('subscription_ends_at', 'idx_tenant_subscription');
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