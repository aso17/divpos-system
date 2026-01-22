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
            $table->foreignId('role_id')
                ->constrained('Ms_roles')
                ->cascadeOnDelete();

            $table->foreignId('module_id')
                ->constrained('Ms_modules')
                ->cascadeOnDelete();

            // IMPORTANT: menu_id covers ALL levels
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

            // Prevent duplicates
            $table->unique(['role_id', 'menu_id']);
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_role_menu_permissions');
    }
};
