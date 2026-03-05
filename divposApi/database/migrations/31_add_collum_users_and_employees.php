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
        // 1. Tambah kolom ke Ms_users
        Schema::table('Ms_users', function (Blueprint $blueprint) {
            $blueprint->after('is_active', function ($table) {
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
            });

            // Foreign Key
            $blueprint->foreign('created_by')->references('id')->on('Ms_users')->onDelete('set null');
            $blueprint->foreign('updated_by')->references('id')->on('Ms_users')->onDelete('set null');
        });

        // 2. Tambah kolom ke Ms_employees
        Schema::table('Ms_employees', function (Blueprint $blueprint) {
            $blueprint->after('is_active', function ($table) {
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
            });

            // Foreign Key merujuk ke tabel Ms_users
            $blueprint->foreign('created_by')->references('id')->on('Ms_users')->onDelete('set null');
            $blueprint->foreign('updated_by')->references('id')->on('Ms_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop Foreign Key dulu sebelum hapus kolom
        Schema::table('Ms_users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['created_by', 'updated_by']);
        });

        Schema::table('Ms_employees', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['created_by', 'updated_by']);
        });
    }
};