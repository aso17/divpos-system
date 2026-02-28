<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       // ...
        Schema::create('Ms_users', function (Blueprint $table) {
        $table->bigIncrements('id'); 
        
        $table->string('full_name', 100);
        $table->string('email', 150)->unique();
        $table->string('username', 50)->unique()->nullable();
        $table->string('password', 255); 
        
        $table->string('phone', 20)->nullable();
        $table->string('avatar', 255)->nullable();     

        // Status
        $table->boolean('is_active')->default(true);       
        $table->timestampTz('email_verified_at')->nullable();

        // 🔐 Security enhancement
        $table->unsignedTinyInteger('login_attempts')->default(0);
        $table->timestampTz('locked_until')->nullable();

        // Activity tracking
        $table->timestampTz('last_login_at')->nullable();
        $table->string('last_login_ip', 45)->nullable(); 
        $table->timestampTz('last_activity_at')->nullable();
        
        // Relation
        $table->foreignId('role_id')
            ->nullable()
            ->constrained('Ms_roles')
            ->nullOnDelete();

        $table->foreignId('tenant_id')
            ->nullable()
            ->constrained('Ms_tenants')
            ->cascadeOnDelete();
        
        // Audit
        $table->timestampsTz();
        $table->softDeletesTz();
        
        // Index 
        $table->index(['tenant_id', 'is_active'], 'idx_user_tenant_active');
        $table->index(['tenant_id', 'role_id'], 'idx_user_tenant_role');
        $table->index(['tenant_id', 'email'], 'idx_tenant_email');
    });
// ... sisa tabel lainnya tetap sama

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

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