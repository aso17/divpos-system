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
        Schema::create('Tr_status_logs', function (Blueprint $table) {
            $table->id();
            
            // --- Relasi ---
            // Kita tetap butuh tenant_id agar bisa ditarik laporan aktivitas per tenant dengan cepat
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('Tr_transactions')->onDelete('cascade');
            
            // --- Detail Status ---
            // Menggunakan Enum agar konsisten dengan status yang ada di table Header
            $table->enum('status', ['PENDING', 'PROCESS', 'READY', 'TAKEN', 'CANCELED']);
            
            // --- Deskripsi & Pelaku ---
            $table->string('changed_by'); // Nama atau ID user yang melakukan perubahan
            $table->text('notes')->nullable(); // Catatan tambahan (misal: "Baju luntur, perlu penanganan khusus")
            $table->string('description')->nullable(); // Keterangan otomatis (misal: "Status diubah ke PROCESS")

            $table->timestamps(); // created_at adalah penanda waktu kejadian (Timestamp log)

            // --- Indexing ---
            $table->index(['tenant_id', 'transaction_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Tr_status_logs');
    }
};