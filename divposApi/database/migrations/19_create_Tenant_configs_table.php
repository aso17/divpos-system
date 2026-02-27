<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_configs', function (Blueprint $table) {
            $table->id();
            // Relasi ke tabel tenants
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
        
            $table->string('key');
            $table->text('value'); 
            
            $table->timestamps();

            // Index agar pencarian config per tenant lebih cepat
            $table->index(['tenant_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_configs');
    }
};