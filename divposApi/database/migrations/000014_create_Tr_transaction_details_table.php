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
        Schema::create('Tr_transaction_details', function (Blueprint $table) {
            $table->id();
            
            // --- Relasi ---
            // Tenant ID tetap disertakan untuk memudahkan filter/laporan tanpa join ke header
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('Tr_transactions')->onDelete('cascade');
            
            // Relasi ke Master (Gunakan nullable & set null agar jika master dihapus, histori transaksi tidak hilang)
            $table->foreignId('package_id')->nullable()->constrained('Ms_packages')->onDelete('set null');
            
            // --- Snapshot Data (Penting!) ---
            // Menyimpan nama layanan saat itu agar jika master berubah, nota lama tidak berubah
            $table->string('package_name', 100); 
            
            // --- Kuantitas & Satuan ---
            // Gunakan decimal (10,2) agar bisa menangkap berat kg seperti 2.55 kg
            $table->decimal('qty', 10, 2); 
            $table->string('unit', 10)->nullable(); // Misal: Kg, Meter, Pcs
            
            // --- Perhitungan Harga per Baris ---
            $table->decimal('price_per_unit', 15, 2); // Harga satuan asli
            $table->decimal('discount_per_unit', 15, 2)->default(0); // Diskon per item jika ada
            $table->decimal('subtotal', 15, 2); // (Price - Discount) * Qty
            
            // --- Informasi Tambahan ---
            $table->string('notes')->nullable(); // Catatan per item (misal: "noda tinta", "kancing lepas")
            
            $table->timestamps();
            $table->softDeletes(); // Opsional, tapi baik untuk audit trail

            // Indexing untuk laporan performa
            $table->index(['tenant_id', 'transaction_id']);
            $table->index('package_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Tr_transaction_details');
    }
};