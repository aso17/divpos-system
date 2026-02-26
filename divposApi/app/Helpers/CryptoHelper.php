<?php

namespace App\Helpers;

class CryptoHelper
{
    /**
     * Enkripsi ID/String ke format Base64 URL Safe dengan Random IV
     */
    public static function encrypt($value)
    {
        if (is_null($value) || $value === '') return null;

        $secretKey = env('APP_SECRET_KEY');
        $key = hash('sha256', $secretKey, true);

        // 1. Generate IV Acak (16 bytes untuk AES-256-CBC)
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('AES-256-CBC'));

        // 2. Enkripsi Data
        $ciphertextRaw = openssl_encrypt(
            (string)$value,
            'AES-256-CBC',
            $key,
            OPENSSL_RAW_DATA,
            $iv
        );

        // 3. Gabungkan IV + Ciphertext
        $combined = $iv . $ciphertextRaw;

        // 4. Convert ke Base64 URL Safe (Hapus padding '=' agar lebih rapi di URL)
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($combined));
    }

    /**
     * Dekripsi String Base64 URL Safe kembali ke teks asli
     */
    public static function decrypt($cipherText)
    {
        if (!$cipherText || !is_string($cipherText)) return null;

        $secretKey = env('APP_SECRET_KEY');

        // 1. Fix Base64 URL Safe
        $base64 = str_replace(['-', '_'], ['+', '/'], $cipherText);
        $remainder = strlen($base64) % 4;
        if ($remainder) $base64 .= str_repeat('=', 4 - $remainder);

        $rawBinary = base64_decode($base64);
        
        // Cek minimal panjang (IV 16 byte + minimal 1 byte data terenkripsi)
        if (!$rawBinary || strlen($rawBinary) <= 16) return null;

        // 2. Ambil IV (16 byte pertama) dan Ciphertext (sisanya)
        $iv = substr($rawBinary, 0, 16);
        $ciphertextRaw = substr($rawBinary, 16);

        // 3. Derivasi Key (SHA256)
        $key = hash('sha256', $secretKey, true);

        // 4. Decrypt
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