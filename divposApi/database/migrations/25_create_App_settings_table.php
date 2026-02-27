<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('App_settings', function (Blueprint $table) {
            $table->id();
            // NULL berarti setting global, isi tenant_id berarti setting khusus tenant
            $table->foreignId('tenant_id')->nullable()->constrained('Ms_tenants')->cascadeOnDelete();
            
            $table->string('key')->index(); // Contoh: 'app_name', 'max_discount'
            $table->text('value')->nullable(); // Nilai dari setting tersebut
            $table->string('type')->default('string'); // string, number, boolean, json
            $table->text('description')->nullable();
            
            $table->timestamps();

            // Unique constraint agar tidak ada key ganda per tenant
            $table->unique(['tenant_id', 'key'], 'unique_tenant_setting');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('App_settings');
    }
};