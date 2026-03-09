<?php

namespace App\Helpers;

class CryptoHelper
{
    // Gunakan static property untuk caching key & iv agar tidak dihitung ulang
    private static $key = null;
    private static $iv = null;

    private static function init()
    {
        if (self::$key === null) {
            // JANGAN pakai env() langsung, pakai config() yang sudah di-cache Laravel
            // Pastikan Mas sudah tambah 'app_secret_key' di config/app.php 
            // atau pakai config('app.key') bawaan Laravel.
            $secretKey = config('app.secret_key', 'default_secret_key_yang_panjang');
            
            // Hitung hash sekali saja selama satu request berjalan
            $fullHash = hash('sha256', $secretKey);
            self::$key = hash('sha256', $secretKey, true);
            self::$iv = substr($fullHash, 0, 16); 
        }
    }

    public static function encrypt($value)
    {
        if (is_null($value) || $value === '') return null;

        self::init();

        $ciphertextRaw = openssl_encrypt(
            (string)$value,
            'AES-256-CBC',
            self::$key,
            OPENSSL_RAW_DATA,
            self::$iv
        );

        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($ciphertextRaw));
    }

    public static function decrypt($cipherText)
    {
        if (!$cipherText || !is_string($cipherText)) return null;

        self::init();

        $base64 = str_replace(['-', '_'], ['+', '/'], $cipherText);
        $remainder = strlen($base64) % 4;
        if ($remainder) $base64 .= str_repeat('=', 4 - $remainder);

        $ciphertextRaw = base64_decode($base64);

        $decrypted = openssl_decrypt(
            $ciphertextRaw,
            'AES-256-CBC',
            self::$key,
            OPENSSL_RAW_DATA,
            self::$iv
        );

        return $decrypted ?: null;
    }
}