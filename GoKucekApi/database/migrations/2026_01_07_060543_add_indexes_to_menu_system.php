<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Optimasi tabel permissions
        Schema::table('Ms_role_menu_permissions', function (Blueprint $table) {
            // Composite Index: Sangat cepat untuk .where('role_id', $id)->where('is_active', true)
            $table->index(['role_id', 'is_active'], 'idx_role_status');
        });

        // 2. Optimasi tabel menus
        Schema::table('Ms_menus', function (Blueprint $table) {
            // Index untuk .where('is_active', true) dan .orderBy('order_no')
            $table->index(['is_active', 'order_no'], 'idx_menu_active_order');
            // Index untuk percepat susun parent-child di Service
            $table->index('parent_id');
        });

        // 3. Optimasi tabel modules (untuk orderBy mo.id)
        Schema::table('Ms_modules', function (Blueprint $table) {
            // Biasanya ID sudah primary key, tapi jika butuh order by id lebih cepat:
            // $table->index('id'); 
        });
    }

    public function down(): void
    {
        Schema::table('Ms_role_menu_permissions', function (Blueprint $table) {
            $table->dropIndex('idx_role_status');
        });
        Schema::table('Ms_menus', function (Blueprint $table) {
            $table->dropIndex('idx_menu_active_order');
            $table->dropIndex(['parent_id']);
        });
    }
};