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
            
            // --- SNAPSHOT DATA (KRUSIAL) ---
            // Simpan nama metode pembayaran saat itu (misal: "Transfer BCA")
            $table->string('payment_method_name', 50); 
            // -------------------------------
            
            // --- Detail Pembayaran ---
            $table->decimal('amount', 15, 2); // Jumlah uang yang dibayarkan
            $table->dateTime('payment_date'); // Waktu pembayaran
            
            // --- Informasi Tambahan ---
            $table->string('reference_no', 100)->nullable(); // Nomor referensi bayar
            $table->string('paid_by', 100)->nullable(); // Nama pembayar
            $table->string('received_by', 100); // Nama kasir (Panjang disesuaikan)
            
            // PERBAIKAN: Gunakan string(255) untuk konsistensi performa
            $table->string('notes', 255)->nullable(); 
            
            $table->timestamps();
            $table->softDeletes();

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