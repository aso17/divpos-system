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
        Schema::create('Router_scripts', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('router_id');

            $table->string('router_scripts_name', 100);
            $table->string('script_type', 30); // radius, hotspot, pppoe
            $table->text('content');

            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('Ms_tenants');

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
        Schema::dropIfExists('Router_scripts');
    }
};
