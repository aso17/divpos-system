<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * File ini dijalankan terakhir untuk mengunci relasi antar tabel.
     */
    public function up(): void
    {
        Schema::table('Ms_users', function (Blueprint $table) {
            // 1. Mengunci relasi ke tabel Roles
            // Jika Role dihapus, user tetap ada tapi role_id jadi NULL
            $table->foreign('role_id')
                  ->references('id')
                  ->on('Ms_roles')
                  ->onDelete('set null');

            // 2. Mengunci relasi ke tabel Tenants
            // Jika Bisnis (Tenant) dihapus, maka semua User di bawahnya ikut terhapus
            $table->foreign('tenant_id')
                  ->references('id')
                  ->on('Ms_tenants')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Ms_users', function (Blueprint $table) {
            // Menghapus constraint agar tabel bisa didrop tanpa error
            $table->dropForeign(['role_id']);
            $table->dropForeign(['tenant_id']);
        });
    }
};