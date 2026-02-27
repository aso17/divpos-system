<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Tr_transaction_details', function (Blueprint $table) {
            $table->id();
            
            // Relasi (Tetap pakai tenant_id untuk performa laporan)
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('Tr_transactions')->onDelete('cascade');
            
            // Master Data (Nullable jika master dihapus)
            $table->foreignId('package_id')->nullable()->constrained('Ms_packages')->onDelete('set null');
            
            // --- SNAPSHOT DATA (KRUSIAL UNTUK HISTORY) ---
            // Simpan semua atribut master saat transaksi terjadi
            $table->string('package_name', 100); 
            $table->decimal('original_price', 15, 2); // Harga dasar paket saat itu
            $table->string('unit', 10)->nullable(); // Satuan saat itu (Kg/Pcs)
            // ---------------------------------------------
            
            // --- Perhitungan Harga per Baris ---
            // qty sudah benar decimal
            $table->decimal('qty', 10, 2); 
            
            // Harga final per unit setelah diskon (jika ada diskon item)
            $table->decimal('price_per_unit', 15, 2); 
            
            // Total baris = qty * price_per_unit
            $table->decimal('subtotal', 15, 2); 
            
            // --- Informasi Tambahan ---
            $table->string('notes', 255)->nullable(); 
            
            $table->timestamps();
            $table->softDeletes();

            // --- Indexing (Optimasi Laporan Detail) ---
            // Komposit index untuk pencarian detail transaksi per tenant
            $table->index(['tenant_id', 'transaction_id'], 'idx_detail_tenant_trans');                
            $table->index('package_id', 'idx_detail_package');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tr_transaction_details');
    }
};