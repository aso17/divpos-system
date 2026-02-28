<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            [
                'key'         => 'appName',
                'value'       => 'DivPOS',
                'type'        => 'string',
                'description' => 'Divpos untuk bisnis jasa seperti laundry, salon, barbershop, carwash, pet grooming'
            ],
            [
                'key'         => 'logo_path',
                'value'       => 'imgApp/logo.webp',  
                'type'        => 'file_path',
                'description' => 'Logo utama aplikasi'
            ],
            [
                'key'         => 'favicon_path',
                'value'       => 'imgApp/favicon.ico',
                'type'        => 'file_path',
                'description' => 'Icon kecil di browser'
            ],
            [
                'key'         => 'footer_text',
                'value'       => '© 2026 DivPOS. All Rights Reserved.',
                'type'        => 'string',
                'description' => 'Text footer di landing page'
            ],
            [
                'key'         => 'domain',
                'value'       => 'localhost',
                'type'        => 'string',
                'description' => 'Domain utama aplikasi'
            ],
        ];

        foreach ($configs as $config) {
            DB::table('system_configurations')->updateOrInsert(
                ['key' => $config['key']],
                $config + ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}