<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('Ms_units', function (Blueprint $table) {
            $table->id();
            // NULL berarti unit global, jika ada ID berarti unit khusus tenant tersebut
            $table->foreignId('tenant_id')->nullable()->constrained('Ms_tenants')->onDelete('cascade');
            
            $table->string('name', 50);
            $table->string('short_name', 10);
            $table->boolean('is_decimal')->default(false); 
            $table->boolean('is_active')->default(true);
            
            $table->timestampsTz();
            $table->softDeletesTz();

            // Mencegah nama unit ganda untuk tenant yang sama
            $table->unique(['tenant_id', 'name'], 'idx_unit_tenant_unique');
        });
    }

    public function down(): void {
        Schema::dropIfExists('Ms_units');
    }
};