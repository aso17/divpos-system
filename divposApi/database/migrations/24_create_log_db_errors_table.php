<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Log_db_errors', function (Blueprint $table) {
            $table->id();
            // Catat user siapa yang menyebabkan error
            $table->foreignId('user_id')->nullable()->constrained('Ms_users')->nullOnDelete();
            // Catat tenant mana yang errorphp
            $table->foreignId('tenant_id')->nullable()->constrained('Ms_tenants')->cascadeOnDelete();
            
            $table->string('error_code')->nullable();
            $table->text('message'); // Pesan error
            $table->longText('sql_query')->nullable(); // Query yang error
            $table->json('bindings')->nullable(); // Parameter yang error
            $table->string('url')->nullable(); // URL saat error terjadi
            $table->ipAddress('ip_address')->nullable();
            
            $table->timestamps();
            
            // Index untuk mempercepat query laporan error
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_db_errors');
    }
};