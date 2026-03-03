<?php

namespace App\Helpers;

class CryptoHelper
{
    public static function encrypt($value)
    {
        if (is_null($value) || $value === '') return null;

        $secretKey = env('APP_SECRET_KEY');
        $key = hash('sha256', $secretKey, true);

        // UBAH: Gunakan IV Statis (16 byte) dari hash key
        $iv = substr(hash('sha256', $secretKey), 0, 16); 

        $ciphertextRaw = openssl_encrypt(
            (string)$value,
            'AES-256-CBC',
            $key,
            OPENSSL_RAW_DATA,
            $iv
        );

        // Jangan gabungkan IV lagi karena sudah statis
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($ciphertextRaw));
    }

    public static function decrypt($cipherText)
    {
        if (!$cipherText || !is_string($cipherText)) return null;

        $secretKey = env('APP_SECRET_KEY');
        $key = hash('sha256', $secretKey, true);
        $iv = substr(hash('sha256', $secretKey), 0, 16); 

        $base64 = str_replace(['-', '_'], ['+', '/'], $cipherText);
        $remainder = strlen($base64) % 4;
        if ($remainder) $base64 .= str_repeat('=', 4 - $remainder);

        $ciphertextRaw = base64_decode($base64);

        $decrypted = openssl_decrypt(
            $ciphertextRaw,
            'AES-256-CBC',
            $key,
            OPENSSL_RAW_DATA,
            $iv
        );

        return $decrypted ?: null;
    }
}