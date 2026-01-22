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
        Schema::create('Ms_users', function (Blueprint $table) {
            $table->bigIncrements('id'); 
            $table->string('full_name', 100);
            $table->string('email', 150)->unique();
            $table->string('username', 50)->unique()->nullable();
            $table->string('password', 255); // bcrypt / argon2

            $table->string('phone', 20)->nullable();       // E.164 format
            $table->string('avatar', 150)->nullable();     // path file saja

            // Status & security
            $table->boolean('is_active')->default(true);
            $table->enum('status', ['active','suspend'])->default('active');
            $table->timestampTz('email_verified_at')->nullable();
            $table->timestampTz('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable(); 
            $table->timestampTz('last_activity_at')->nullable();

            // Relation
            $table->foreignId('role_id')->nullable()->constrained('Ms_roles')->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('Ms_tenants')->nullOnDelete();

            // Audit
            $table->timestampsTz();
            $table->softDeletesTz();

            // Index 
            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'role_id']);
        });



        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
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

        $table->timestamp('logged_in_at');
    });


    }

    /**
     * Reverse the migrations.
     */
   public function down(): void
    {
        Schema::dropIfExists('log_user_login');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('Ms_users');
    }

};
