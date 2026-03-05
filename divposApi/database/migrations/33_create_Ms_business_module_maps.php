<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ms_business_module_maps', function (Blueprint $table) {
            $table->id();

            // Relasi ke Tipe Bisnis (Laundry, Salon, dll)
            $table->foreignId('business_type_id')
                  ->constrained('Ms_business_types')
                  ->cascadeOnDelete();

            // Relasi ke Modul (Dashboard, Transaksi, Master, dll)
            $table->foreignId('module_id')
                  ->constrained('Ms_modules')
                  ->cascadeOnDelete();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Agar tidak ada duplikasi mapping yang sama
            $table->unique(['business_type_id', 'module_id'], 'unique_business_module');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_business_module_maps');
    }
};