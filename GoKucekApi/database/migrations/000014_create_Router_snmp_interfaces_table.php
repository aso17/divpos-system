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
       Schema::create('Router_snmp_interfaces', function (Blueprint $table) {

            $table->bigIncrements('id');
            $table->unsignedBigInteger('router_id');
            $table->string('interface_name', 100);
            $table->unsignedBigInteger('rx_bytes')->default(0);
            $table->unsignedBigInteger('tx_bytes')->default(0);
            $table->timestampTz('updated_at')->useCurrent();
            $table->index('router_id');
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
        Schema::dropIfExists('Router_snmp_interfaces');
    }
};
