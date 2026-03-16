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
            $table->string('invoice_no', 25); 
            $table->unsignedSmallInteger('queue_number')->nullable()->index();
            $table->unsignedBigInteger('customer_id')->nullable(); 
            $table->string('customer_name', 100)->nullable(); 
            $table->string('customer_phone', 20)->nullable();

            // --- Tracking Waktu & Optimasi Query ---
            $table->dateTimeTz('order_date'); // Menggunakan Timezone untuk akurasi POS
            $table->dateTimeTz('pickup_date')->nullable(); 
            $table->dateTimeTz('actual_pickup_date')->nullable(); 
            $table->unsignedSmallInteger('order_year')->index(); // Untuk filter tahunan & Lock Invoice
            $table->unsignedTinyInteger('order_month')->index(); // Untuk filter bulanan

            // --- Financials ---
            $table->decimal('total_base_price', 15, 2)->default(0); 
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0); 

            // --- Pembayaran ---
            $table->decimal('dp_amount', 15, 2)->default(0); 
            $table->foreignId('payment_method_id')->nullable()->constrained('Ms_payment_methods')->onDelete('set null');
            $table->decimal('payment_amount', 15, 2)->default(0); 
            $table->decimal('change_amount', 15, 2)->default(0);  
            $table->decimal('total_paid', 15, 2)->default(0);    

            // --- Status (Menggunakan String agar Fleksibel) ---
            $table->string('status', 20)->default('PENDING')->index(); 
            $table->string('payment_status', 20)->default('UNPAID')->index();
            
            $table->text('notes')->nullable(); 
            
            $table->unsignedBigInteger('created_by')->index(); 
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            
            $table->timestampsTz();
            $table->softDeletesTz();

            // --- Audit Constraints ---
            $table->foreign('created_by')->references('id')->on('Ms_users')->onDelete('restrict');
            $table->foreign('updated_by')->references('id')->on('Ms_users')->onDelete('restrict');

            // --- Composite Indexing untuk High Performance ---
            $table->unique(['tenant_id', 'invoice_no']); 
            
            $table->index(['outlet_id', 'order_date', 'queue_number'], 'idx_queue_logic');
            // Optimasi pencarian invoice terakhir (Tenant + Tahun + Invoice)
            $table->index(['tenant_id', 'order_year', 'invoice_no'], 'idx_invoice_speed');
            // Optimasi Dashboard/Laporan
            $table->index(['tenant_id', 'outlet_id', 'status', 'payment_status'], 'idx_trans_report_fast'); 
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