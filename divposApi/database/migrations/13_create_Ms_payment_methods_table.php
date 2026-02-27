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
        Schema::create('Ms_payment_methods', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke Tenant
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            
            // Informasi Utama
            $table->string('name', 50); // Contoh: Tunai, Transfer Mandiri, QRIS ShopeePay
            $table->string('type', 20)->comment('CASH, TRANSFER, E-WALLET');
            $table->string('account_number', 50)->nullable(); // Nomor Rekening / Nomor HP
            $table->string('account_name', 100)->nullable();  // Atas Nama
            
            // Status & Deskripsi
            $table->string('description', 200)->nullable();
            $table->boolean('is_active')->default(true);
            
            // --- TAMBAHAN ---
            // Untuk metode pembayaran default (biasanya Tunai)
            $table->boolean('is_default')->default(false);
            // ----------------
            
            // Audit Trail
            $table->string('created_by', 50)->nullable();
            $table->string('updated_by', 50)->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Agar satu tenant tidak punya nama metode pembayaran yang ganda
            $table->unique(['tenant_id', 'name'], 'idx_pay_tenant_name');
            
            // --- TAMBAHAN ---
            // Index untuk performa filter metode aktif per tenant
            $table->index(['tenant_id', 'is_active'], 'idx_pay_tenant_active');
            // ----------------
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_payment_methods');
    }
};