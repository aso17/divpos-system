<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ms_sub_menus', function (Blueprint $table) {
            $table->id();

            // Relation
            $table->foreignId('menu_id')
                  ->constrained('Ms_menus')
                  ->cascadeOnDelete();

            // Identity
            $table->string('sub_menu_name', 100);
            $table->string('code', 50)->unique(); // USER_CREATE, USER_LIST
            $table->string('route_name', 150)->nullable();

            // UI
            $table->integer('order_no')->default(0);

            // Status
            $table->boolean('is_active')->default(true);

            // Audit
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Ms_sub_menus');
    }
};
