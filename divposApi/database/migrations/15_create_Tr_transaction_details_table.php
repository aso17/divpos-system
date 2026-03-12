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
            
            // Relasi
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('Tr_transactions')->onDelete('cascade');
            $table->foreignId('package_id')->nullable()->constrained('Ms_packages')->onDelete('set null');
            
            // --- SNAPSHOT DATA ---
            $table->string('package_name', 100); 
            $table->decimal('original_price', 15, 2); 
            $table->string('unit', 10)->nullable(); 
            
            // --- Perhitungan Harga per Baris ---
            // PERBAIKAN: Ubah ke 12, 3 untuk akurasi timbangan Laundry (gram)
            $table->decimal('qty', 12, 3)->default(0); 
            
            // Harga setelah diskon (jika ada) per unit
            $table->decimal('price_per_unit', 15, 2)->default(0); 
            
            // Total per item (qty * price_per_unit)
            $table->decimal('subtotal', 15, 2)->default(0); 
            
            // --- Informasi Tambahan ---
            $table->string('notes', 255)->nullable(); 
            
            $table->timestampsTz();
            $table->softDeletesTz();

            // Indexing
            $table->index(['tenant_id', 'transaction_id'], 'idx_detail_tenant_trans');                
            $table->index('package_id', 'idx_detail_package');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tr_transaction_details');
    }
};