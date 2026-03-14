<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();       
        // 1. Ambil semua ID tenant yang sudah dibuat di TenantSeeder
        $tenants = DB::table('Ms_tenants')->pluck('id');

        foreach ($tenants as $tenantId) {
            $methods = [
                [
                    'tenant_id'      => $tenantId,
                    'code'           => 'CASH',
                    'name'           => 'Tunai',
                    'type'           => 'CASH',
                    'is_cash'        => true, // Frontend akan munculkan input kembalian
                    'is_dp_enabled'  => false,
                    'allow_zero_pay' => false,
                    'description'    => 'Bayar cash di kasir',
                    'is_active'      => true,
                    'is_default'     => true,
                    'created_at'     => $now,
                ],
                [
                    'tenant_id'      => $tenantId,
                    'code'           => 'MID_QRIS',
                    'name'           => 'QRIS',
                    'type'           => 'E-WALLET',
                    'is_cash'        => false,
                    'is_dp_enabled'  => true,
                    'allow_zero_pay' => false,
                    'description'    => 'Scan QR Code untuk bayar',
                    'is_active'      => true,
                    'is_default'     => false,
                    'created_at'     => $now,
                ],
                [
                    'tenant_id'      => $tenantId,
                    'code'           => 'PAY_LATER',
                    'name'           => 'Bayar Nanti',
                    'type'           => 'DEBT',
                    'is_cash'        => false,
                    'is_dp_enabled'  => false,
                    'allow_zero_pay' => true, // KUNCI: Tombol aktif walau bayar 0
                    'description'    => 'Bayar saat pengambilan / piutang',
                    'is_active'      => true,
                    'is_default'     => false,
                    'created_at'     => $now,
                ]
            ];

            foreach ($methods as $method) {
                // Gunakan updateOrInsert agar tidak duplikat jika seeder dijalankan ulang
                DB::table('Ms_payment_methods')->updateOrInsert(
                    [
                        'tenant_id' => $method['tenant_id'], 
                        'code'      => $method['code']
                    ],
                    $method
                );
            }
        }

        $this->command->info("Metode Pembayaran untuk semua tenant berhasil ditanam!");
    }
}