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
       Schema::create('Router_status', function (Blueprint $table) {
            $table->unsignedBigInteger('router_id')->primary();

            $table->integer('online_users')->default(0);
            $table->decimal('cpu_load', 5, 2)->nullable();
            $table->decimal('memory_usage', 5, 2)->nullable();
            $table->unsignedBigInteger('uptime_seconds')->nullable();

            $table->enum('snmp_status', [
                'CONNECTED',
                'DISCONNECTED'
            ])->default('DISCONNECTED');

            $table->timestampTz('updated_at')->useCurrent();

            $table->foreign('router_id')
                ->references('id')
                ->on('Routers')
                ->onDelete('cascade');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Router_status');
    }
};
