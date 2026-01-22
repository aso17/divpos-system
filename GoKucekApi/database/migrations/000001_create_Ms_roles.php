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

            // Identity
            $table->string('role_name', 100);
            $table->string('code', 50)->unique(); // ADMIN, USER, SUPER_ADMIN

            // Status
            $table->boolean('is_active')->default(true);

            // Audit
            $table->timestamps();
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
