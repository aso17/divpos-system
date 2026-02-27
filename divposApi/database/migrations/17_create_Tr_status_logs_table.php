<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Tr_status_logs', function (Blueprint $table) {
            $table->id();
            
            // --- Relasi ---
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('Tr_transactions')->onDelete('cascade');
            
            // --- Detail Status ---
            // Enum konsisten dengan Tr_transactions
            $table->enum('status', ['PENDING', 'PROCESS', 'READY', 'TAKEN', 'CANCELED']);
            
            // --- Deskripsi & Pelaku ---
            $table->string('changed_by', 100); // Nama/ID user yang mengubah status
            
            // PERBAIKAN: Gunakan string(255) untuk konsistensi performa
            $table->string('notes', 255)->nullable(); 
            
            // PERBAIKAN: Beri batas panjang agar efisien
            $table->string('description', 255)->nullable(); 

            // created_at adalah penanda waktu kejadian
            $table->timestamp('created_at')->useCurrent();
            // updated_at tidak terlalu krusial untuk log, tapi baik ada
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // --- Indexing ---
            // Optimasi komposit untuk laporan status per transaksi
            $table->index(['tenant_id', 'transaction_id'], 'idx_log_tenant_trans');
            $table->index('status', 'idx_log_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tr_status_logs');
    }
};