<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ms_menus', function (Blueprint $table) {
            $table->id();

            // Module relation
            $table->foreignId('module_id')
                  ->constrained('Ms_modules')
                  ->cascadeOnDelete();

            // 🔥 Parent menu (SELF RELATION)
            $table->foreignId('parent_id')
                  ->nullable()
                  ->constrained('Ms_menus')
                  ->nullOnDelete();

            // Identity
            $table->string('menu_name', 100);
            $table->string('code', 50)->unique(); // USER_MGMT, ROLE_MGMT
            $table->string('route_name', 150)->nullable();

            // UI
            $table->string('icon', 50)->nullable();
            $table->integer('order_no')->default(0);

            // Status
            $table->boolean('is_active')->default(true);

            // Audit
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_menus');
    }
};
