<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_configurations', function (Blueprint $table) {
            $table->id();          
            // Contoh key: 'app_name', 'logo_path', 'favicon_path', 'footer_text', 'landing_domain'
            $table->string('key')->unique()->index(); 
            $table->text('value')->nullable(); // Menyimpan path file logo, atau string text
            $table->string('type')->default('string'); // string, file_path, color
            $table->text('description')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_configurations');
    }
};