<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ms_users', function (Blueprint $table) {
            $table->id(); 

            $table->foreignId('tenant_id')
                  ->nullable()
                  ->index(); 

            // --- DATA AUTENTIKASI ---
            $table->string('email', 150); 
            $table->string('username', 50)->nullable(); 
            $table->string('password', 255); 
            $table->string('avatar', 255)->nullable();    

            $table->boolean('is_active')->default(true)->index();
            // Audit Trailing
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();

            $table->timestampTz('email_verified_at')->nullable();

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
            
            // Opsional: Jika ingin pakai foreign key resmi agar data konsisten
            $table->foreign('created_by')->references('id')->on('Ms_users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('Ms_users')->onDelete('set null');

            
            });

            DB::statement('CREATE UNIQUE INDEX users_email_active_unique ON "Ms_users" (email) WHERE deleted_at IS NULL');
            DB::statement('CREATE UNIQUE INDEX users_username_active_unique ON "Ms_users" (username) WHERE deleted_at IS NULL');

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