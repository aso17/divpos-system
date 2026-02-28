<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('User_refresh_tokens', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('Ms_users')
                ->cascadeOnDelete();

            // SHA256 hash = 64 karakter (lebih efisien dari 255)
            $table->string('token', 64)->unique();

            // Device name cukup 150 (browser/device name pendek)
            $table->string('device_name', 150)->nullable();

            // IPv4 + IPv6 safe
            $table->string('ip_address', 45)->nullable();

            // WAJIB text karena user agent bisa > 200 char
            $table->text('user_agent')->nullable();

            $table->timestampTz('expires_at');
            $table->timestampTz('revoked_at')->nullable();

            $table->timestampsTz();

            // Index untuk performa validasi refresh
            $table->index(['user_id', 'revoked_at'], 'idx_user_active_tokens');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('User_refresh_tokens');
    }
};