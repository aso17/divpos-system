<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('Tr_transaction_details', function (Blueprint $table) {
            $table->id();

            // Relasi Utama
            $table->foreignId('tenant_id')->constrained('Ms_tenants')->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained('Tr_transactions')->onDelete('cascade');
            $table->foreignId('package_id')->nullable()->constrained('Ms_packages')->onDelete('set null');

            // Relasi Petugas
            $table->foreignId('employee_id')
                ->nullable()
                ->constrained('Ms_employees')
                ->onDelete('set null')
                ->comment('Stylist/Groomer/Staff yang melakukan pengerjaan');

            // --- SNAPSHOT DATA ---
            // 🔥 TAMBAHKAN INI: Snapshot nama karyawan saat transaksi terjadi
            $table->string('employee_name', 100)->nullable()->after('employee_id');

            $table->string('package_name', 100);
            $table->decimal('original_price', 15, 2);
            $table->string('unit', 10)->nullable();

            // --- Perhitungan Harga per Baris ---
            $table->decimal('qty', 12, 3)->default(0);
            $table->decimal('price_per_unit', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);

            // --- Informasi Tambahan ---
            $table->string('notes', 255)->nullable();

            $table->timestampsTz();
            $table->softDeletesTz();

            /* -------------------------------------------------------------------------- */
            /* INDEXING                                                                   */
            /* -------------------------------------------------------------------------- */
            $table->index(['tenant_id', 'transaction_id'], 'idx_detail_tenant_trans');
            $table->index(['tenant_id', 'employee_id'], 'idx_detail_tenant_employee');
            $table->index('package_id', 'idx_detail_package');

            // Opsional: Index untuk pencarian nama karyawan di laporan detail
            $table->index('employee_name', 'idx_detail_emp_name_snapshot');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Tr_transaction_details');
    }
};
