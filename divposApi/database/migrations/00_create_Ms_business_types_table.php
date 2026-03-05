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
        Schema::create('Ms_business_types', function (Blueprint $table) {
        $table->id();
        $table->string('name', 50)->unique(); // 'LAUNDRY'
        $table->string('code', 20)->unique(); // 'LDR'
        $table->string('slug', 60)->unique(); // Untuk URL ramah SEO: 'laundry-services'
        $table->text('description')->nullable(); // Penjelasan singkat
        $table->boolean('is_active')->default(true)->index(); // Kontrol aktif/nonaktif
        $table->timestamps();
    });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_business_types');
    }
};