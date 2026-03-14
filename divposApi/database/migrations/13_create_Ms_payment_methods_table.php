<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('Ms_payment_methods', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('tenant_id')
                  ->nullable() 
                  ->constrained('Ms_tenants')
                  ->onDelete('cascade');        
            
            $table->string('code', 30)->index(); 
            $table->string('name', 50); 
            $table->string('type', 20)->comment('CASH, TRANSFER, E-WALLET, DEBT');
            
            // --- KOLOM BARU UNTUK LOGIC POS ---
            $table->boolean('is_cash')->default(false)->comment('Jika true, munculkan input bayar & kembalian');
            $table->boolean('is_dp_enabled')->default(false)->comment('Jika true, izinkan input DP');
            $table->boolean('allow_zero_pay')->default(false)->comment('Jika true, tombol simpan aktif meski bayar 0 (Bayar Nanti)');
            // ----------------------------------

            $table->string('description', 200)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index untuk performa query
            $table->index(['tenant_id', 'is_active'], 'idx_pay_tenant_active');
        });

        // Unique index agar code tidak kembar per tenant (PostgreSQL friendly)
        DB::statement('CREATE UNIQUE INDEX idx_pay_method_unique_code ON "Ms_payment_methods" (COALESCE(tenant_id, 0), code) WHERE deleted_at IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_payment_methods');
    }
};