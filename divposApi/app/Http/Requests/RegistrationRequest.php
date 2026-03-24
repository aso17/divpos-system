<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Helpers\CryptoHelper;

class RegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Karena ini publik (pendaftaran), kita izinkan true
        return true;
    }

    protected function prepareForValidation()
    {
        if ($this->business_type_id && is_string($this->business_type_id)) {
            try {
                // Dekripsi ID ke format Integer agar lolos validasi 'exists' dan 'integer'
                $decryptedId = CryptoHelper::decrypt($this->business_type_id);

                $this->merge([
                    'business_type_id' => $decryptedId,
                ]);
            } catch (\Exception $e) {
                // Jika gagal dekripsi (data dimanipulasi), set null agar kena rule 'required'
                $this->merge([
                    'business_type_id' => null,
                ]);
            }
        }
    }

    public function rules(): array
    {
        return [
            // --- VALIDASI TENANT (BISNIS) ---
            'name' => [
                'required',
                'string',
                'min:3',
                'max:150',
                'regex:/^[a-zA-Z0-9\s.\-]+$/', // Nama bisnis standar
            ],
            'business_type_id' => [
                'required',
                'integer',
                Rule::exists('Ms_business_types', 'id')->where('is_active', true)
            ],
            'address' => [
                'required',
                'string',
                'min:10',
                'max:500'
            ],

            // --- VALIDASI USER (OWNER) ---
            'email' => [
                'required',
                'email:rfc,dns', // Validasi DNS untuk memastikan email benar-benar ada
                'max:150',
                // Cek unik di Ms_users yang tidak di-delete
                Rule::unique('Ms_users', 'email')->whereNull('deleted_at'),
            ],
            'phone' => [
                'required',
                'string',
                'min:10',
                'max:20',
                'regex:/^([0-9\s\-\+\(\)]*)$/',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                // Mas bisa tambah 'confirmed' jika di FE ada input Re-type Password
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'             => 'Nama bisnis wajib diisi.',
            'name.regex'                => 'Nama bisnis hanya boleh huruf, angka, titik, atau strip.',
            'business_type_id.required' => 'Silakan pilih jenis bisnis Anda.',
            'business_type_id.exists'   => 'Jenis bisnis tidak terdaftar atau tidak aktif.',
            'email.required'            => 'Email login wajib diisi.',
            'email.email'               => 'Format email tidak valid.',
            'email.unique'              => 'Email ini sudah digunakan oleh bisnis lain.',
            'phone.required'            => 'Nomor WhatsApp/HP wajib diisi.',
            'phone.min'                 => 'Nomor HP minimal 10 digit.',
            'password.required'         => 'Password wajib diisi.',
            'password.min'              => 'Password minimal harus 8 karakter.',
            'address.required'          => 'Alamat outlet wajib diisi lengkap.',
        ];
    }
}
