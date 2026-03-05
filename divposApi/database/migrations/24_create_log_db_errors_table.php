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
            // 1. Relasi User (nullOnDelete sudah benar)
            $table->foreignId('user_id')->nullable()->constrained('Ms_users')->nullOnDelete();
            
            // 2. Relasi Tenant (cascadeOnDelete sudah benar)
            $table->foreignId('tenant_id')->nullable()->constrained('Ms_tenants')->cascadeOnDelete();
            
            $table->string('error_code')->nullable();
            $table->text('message'); 
            $table->longText('sql_query')->nullable(); 
            $table->json('bindings')->nullable(); 
            
            // 3. Tambahan Informative (Opsional tapi berguna)
            $table->string('method', 10)->nullable(); // GET, POST, DELETE, dll.
            $table->string('user_agent')->nullable(); // Mengetahui browser/perangkat user
            
            $table->string('url')->nullable(); 
            $table->ipAddress('ip_address')->nullable();
            
            $table->timestamps();
            
            // 4. Indexing (Gunakan index pada tenant_id juga untuk filtering per bisnis)
            $table->index('tenant_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Log_db_errors'); // Perhatikan case-sensitive nama tabel
    }
};