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
            // UBAH KE STRING: Menghilangkan error Check Violation di Postgres
            $table->string('status', 20)->index(); 
            
            // --- Deskripsi & Pelaku ---
            $table->string('changed_by', 100); 
            
            // Gabungkan notes dan description jika fungsinya sama, 
            // atau tetap pisah tapi pastikan panjangnya cukup.
            $table->string('description', 255)->nullable(); 
            $table->text('notes')->nullable(); // Gunakan text jika isinya bisa panjang

            $table->timestampsTz();
            $table->softDeletesTz();

            // --- Indexing ---
            // Optimasi komposit: Mencari log berdasarkan transaksi milik tenant tertentu
            $table->index(['tenant_id', 'transaction_id'], 'idx_log_tenant_trans');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tr_status_logs');
    }
};