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
        Schema::create('Tr_transactions', function (Blueprint $table) {
            $table->id();
            
            // --- Identitas & Relasi ---
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('outlet_id')->constrained('Ms_outlets')->onDelete('cascade');
            $table->string('invoice_no', 25); // Contoh: INV/2024/0001
            
            // Relasi Customer (Bisa nullable jika laundry kiloan tanpa data member lengkap)
            $table->unsignedBigInteger('customer_id')->nullable(); 
            $table->string('customer_name', 100)->nullable(); // Backup jika customer_id null
            $table->string('customer_phone', 20)->nullable();

            // --- Tracking Waktu Laundry ---
            $table->dateTime('order_date');
            $table->dateTime('pickup_date')->nullable(); // Estimasi selesai
            $table->dateTime('actual_pickup_date')->nullable(); // Waktu diambil oleh customer

            // --- Financials (Perhitungan Harga) ---
            $table->decimal('total_base_price', 15, 2)->default(0); // Harga sebelum diskon/pajak
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0); // Nilai akhir yang harus dibayar

            // --- Pembayaran Kasir (Retail Logic) ---
            // Digunakan untuk mencatat nominal yang diterima saat transaksi awal
            $table->foreignId('payment_method_id')->nullable()->constrained('Ms_payment_methods')->onDelete('set null');
            $table->decimal('payment_amount', 15, 2)->default(0); // Uang yang diterima
            $table->decimal('change_amount', 15, 2)->default(0);  // Kembalian
            $table->decimal('total_paid', 15, 2)->default(0);    // Total akumulasi uang masuk (untuk Partial Payment)

            // --- Status & Kondisi ---
            $table->enum('status', ['PENDING', 'PROCESS', 'READY', 'TAKEN', 'CANCELED'])->default('PENDING');
            $table->enum('payment_status', ['UNPAID', 'PARTIAL', 'PAID'])->default('UNPAID');
            
            $table->text('notes')->nullable(); // Catatan khusus
            $table->string('created_by');
            $table->string('updated_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

           // --- Indexing (Kecepatan Query) ---
            $table->unique(['tenant_id', 'invoice_no']); // Invoice tidak boleh kembar dalam 1 tenant

            // PERBAIKAN: Masukkan outlet_id ke dalam index komposit utama
            $table->index(['tenant_id', 'outlet_id', 'status'], 'idx_trans_tenant_outlet_status');                
            $table->index(['tenant_id', 'order_date'], 'idx_trans_tenant_date');                
            $table->index(['customer_phone'], 'idx_trans_cust_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Tr_transactions');
    }
};