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
        Schema::create('Ms_roles', function (Blueprint $table) {
            $table->id();
            // Relasi ke Tenant
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');          
            $table->string('role_name', 100);
            $table->string('code', 50); // Hapus unique() di sini
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            // Kode role unik hanya di dalam satu tenant yang sama
            $table->unique(['tenant_id', 'code']); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Ms_roles');
    }
};
