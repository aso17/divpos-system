<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       Schema::create('Ms_role_menu_permissions', function (Blueprint $table) {
            $table->id();

            // Relations
            // Menambahkan tenant_id sebagai identitas utama SaaS
            $table->foreignId('tenant_id')
                ->constrained('Ms_tenants')
                ->cascadeOnDelete();

            $table->foreignId('role_id')
                ->constrained('Ms_roles')
                ->cascadeOnDelete();

            $table->foreignId('module_id')
                ->constrained('Ms_modules')
                ->cascadeOnDelete();

            $table->foreignId('menu_id')
                ->constrained('Ms_menus')
                ->cascadeOnDelete();

            // Permissions
            $table->boolean('can_view')->default(false);
            $table->boolean('can_create')->default(false);
            $table->boolean('can_update')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->boolean('can_export')->default(false);

            // Status
            $table->boolean('is_active')->default(true);

            // Audit
            $table->string('created_by', 50)->nullable();
            $table->timestamps();

            // Prevent duplicates - Ditambahkan tenant_id ke unique constraint
            // Agar satu menu dalam satu tenant tidak memiliki duplikasi role
            $table->unique(['tenant_id', 'role_id', 'menu_id'], 'unique_tenant_role_menu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_role_menu_permissions');
    }
};