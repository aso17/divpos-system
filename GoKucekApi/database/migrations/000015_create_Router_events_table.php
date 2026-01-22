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
      Schema::create('Router_events', function (Blueprint $table) {
        $table->bigIncrements('id');

        $table->unsignedBigInteger('tenant_id');
        $table->unsignedBigInteger('router_id');

        $table->string('event_type', 30); 
        $table->text('message')->nullable();

        $table->timestampTz('created_at')->useCurrent();

        $table->index(['router_id', 'created_at']);

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
        Schema::dropIfExists('Router_events');
    }
};
