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
        Schema::create('Tr_payments', function (Blueprint $table) {
            $table->id();
            
            // --- Relasi ---
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('Tr_transactions')->onDelete('cascade');
            
            // Menggunakan set null agar jika metode pembayaran dihapus (misal: bank tertentu tidak dipakai lagi), 
            // data histori transaksi keuangan tetap tersimpan.
            $table->foreignId('payment_method_id')->nullable()->constrained('Ms_payment_methods')->onDelete('set null');
            
            // --- Detail Pembayaran ---
            $table->decimal('amount', 15, 2); // Jumlah uang yang dibayarkan pada termin ini
            $table->dateTime('payment_date'); // Waktu pembayaran dilakukan
            
            // --- Informasi Tambahan (Audit Trail) ---
            $table->string('reference_no', 100)->nullable(); // Nomor struk, kode bayar QRIS, atau 4 digit kartu
            $table->string('paid_by', 100)->nullable();      // Nama pembayar (opsional, jika beda dengan customer)
            $table->string('received_by');                   // Nama kasir yang menerima uang/memproses transaksi
            
            $table->text('notes')->nullable(); // Catatan tambahan untuk pembayaran ini
            
            $table->timestamps();
            $table->softDeletes();

            // --- Indexing ---
            // Mempercepat pencarian histori pembayaran per transaksi dan filter per tenant
            $table->index(['tenant_id', 'transaction_id']);
            $table->index('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Tr_payments');
    }
};