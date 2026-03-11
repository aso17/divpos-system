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
        
        $methods = [
                [
                    'tenant_id'   => null,
                    'code'        => 'CASH',
                    'name'        => 'Tunai',
                    'type'        => 'CASH',
                    'description' => 'Bayar cash di kasir',
                    'is_active'   => true,
                    'is_default'  => true,
                    'created_at'  => $now,
                ],
                [
                    'tenant_id'   => null,
                    'code'        => 'MID_QRIS',
                    'name'        => 'QRIS (Gopay/OVO/ShopeePay)',
                    'type'        => 'E-WALLET',
                    'description' => 'Satu QR untuk semua e-wallet',
                    'is_active'   => true,
                    'is_default'  => false,
                    'created_at'  => $now,
                ],
                [
                    'tenant_id'   => null,
                    'code'        => 'MID_VA_GENERAL', 
                    'name'        => 'Transfer Bank (VA)',
                    'type'        => 'TRANSFER',
                    'description' => 'BCA, Mandiri, BNI, BRI, dll',
                    'is_active'   => true,
                    'is_default'  => false,
                    'created_at'  => $now,
                ]
            ];

       
        foreach ($methods as $method) {
            DB::table('Ms_payment_methods')->updateOrInsert(
                ['code' => $method['code'], 'tenant_id' => null],
                $method
            );
        }
    }
}