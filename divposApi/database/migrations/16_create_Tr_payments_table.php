<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Tr_payments', function (Blueprint $table) {
            $table->id();
            
            // --- Relasi ---
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('Tr_transactions')->onDelete('cascade');
            
            // Relasi ke metode pembayaran (nullable)
            $table->foreignId('payment_method_id')->nullable()->constrained('Ms_payment_methods')->onDelete('set null');
            
            // --- SNAPSHOT DATA ---
            // Simpan nama metode pembayaran saat itu (misal: "Cash" atau "QRIS")
            $table->string('payment_method_name', 50); 
            
            // --- Detail Pembayaran ---
            // Uang bersih yang masuk (sudah dipotong kembalian)
            $table->decimal('amount', 15, 2); 
            $table->dateTime('payment_date')->useCurrent(); 
            
            // --- Informasi Tambahan ---
            // Untuk QRIS, ini bisa diisi nomor referensi/ID transaksi dari provider
            $table->string('reference_no', 100)->nullable(); 
            // Nama kasir yang bertugas saat itu
            $table->string('received_by', 100); 
            
            $table->string('notes', 255)->nullable(); 
            
            $table->timestampsTz();
            $table->softDeletesTz();

            // --- Indexing ---
            $table->index(['tenant_id', 'transaction_id'], 'idx_pay_tenant_trans');
            $table->index('payment_date', 'idx_pay_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tr_payments');
    }
};