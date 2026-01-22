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
       Schema::create('Router_status_logs', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('router_id');

            $table->integer('online_users')->nullable();
            $table->decimal('cpu_load', 5, 2)->nullable();
            $table->enum('snmp_status', [
                'CONNECTED',
                'DISCONNECTED'
            ])->nullable();

            $table->timestampTz('created_at')->useCurrent();

            $table->index(['router_id', 'created_at']);

            $table->foreign('tenant_id')
                ->references('id')
                ->on('Ms_tenants');

            $table->foreign('router_id')
                ->references('id')
                ->on('Routers');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Router_status_logs');
    }
};
