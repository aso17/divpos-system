<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Ms_modules', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('module_name', 100);
            $table->string('code', 50)->unique(); // MASTER, REPORT, WORKFLOW

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
        Schema::dropIfExists('Ms_modules');
    }
};
