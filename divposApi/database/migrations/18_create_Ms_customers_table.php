<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ms_customers', function (Blueprint $table) {
            $table->id();
            // Multi-tenancy
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            
            // Informasi Utama
            $table->string('name', 100);
            $table->string('phone', 20); // Gunakan string untuk handle '08' atau '+62'
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            
            // Tambahan untuk Bisnis Laundry
            $table->enum('gender', ['L', 'P'])->nullable();
            $table->decimal('point', 15, 2)->default(0); // Untuk sistem reward/loyalty
            $table->boolean('is_active')->default(true);
            
           $table->unsignedBigInteger('created_by')->index(); // Wajib ada ID pembuat
           $table->unsignedBigInteger('updated_by')->nullable()->index();

            $table->timestampsTz();
            $table->softDeletesTz();

            $table->foreign('created_by')->references('id')->on('Ms_users')->onDelete('restrict');
            
            $table->foreign('updated_by')->references('id')->on('Ms_users')->onDelete('restrict');
            // Indexing agar pencarian nama/HP cepat saat kasir mengetik di POS
            $table->index(['tenant_id', 'phone']);
            $table->index(['tenant_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_customers');
    }
};