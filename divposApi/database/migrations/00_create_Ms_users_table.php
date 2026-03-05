<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ms_users', function (Blueprint $table) {
            $table->id(); // Shorthand untuk bigIncrements('id')

            // --- PENTING: Penanda Bisnis ---
            // Kita buat nullable agar tidak bentrok 'telur vs ayam' saat registrasi owner
            $table->foreignId('tenant_id')
                  ->nullable()
                  ->index(); // Cukup index saja, constrained opsional jika urutan migrasinya sulit

            // --- DATA AUTENTIKASI ---
            $table->string('email', 150)->unique();
            $table->string('username', 50)->unique()->nullable();
            $table->string('password', 255); 
            $table->string('avatar', 255)->nullable();    

            // Status Login (Tambah index untuk filter cepat)
            $table->boolean('is_active')->default(true)->index();
            
            $table->timestampTz('email_verified_at')->nullable();

            // 🔐 Security enhancement (Sudah Bagus)
            $table->unsignedTinyInteger('login_attempts')->default(0);
            $table->timestampTz('locked_until')->nullable();

            // Activity tracking
            $table->timestampTz('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable(); 
            $table->timestampTz('last_activity_at')->nullable();
            
            // --- HAK AKSES ---
           $table->foreignId('role_id')->nullable()->index();
            
            // Audit
            $table->timestampsTz();
            $table->softDeletesTz();
            
            // Note: Tidak perlu $table->index('email') secara manual karena unique() 
            // di PostgreSQL/MySQL sudah otomatis membuat index B-Tree.
        });

        // Tabel password_reset_tokens (Sudah Tepat)
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Tabel log_user_login (Sudah Tepat)
        Schema::create('log_user_login', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('Ms_users')
                ->cascadeOnDelete();

            $table->ipAddress('ip_address');
            $table->string('user_agent')->nullable();
            $table->boolean('is_success')->default(true);
            $table->string('fail_reason')->nullable();
            $table->timestamp('logged_in_at')->useCurrent();

            $table->index(['user_id', 'logged_in_at'], 'idx_log_user_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('log_user_login');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('Ms_users');
    }
};