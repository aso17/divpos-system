<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Helpers\CryptoHelper;

class RegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // 1. Dekripsi Business Type ID
        if ($this->business_type_id && is_string($this->business_type_id)) {
            try {
                $decryptedId = CryptoHelper::decrypt($this->business_type_id);
                $this->merge(['business_type_id' => $decryptedId]);
            } catch (\Exception $e) {
                $this->merge(['business_type_id' => null]);
            }
        }

        // 2. Sanitasi string input — trim spasi berlebih
        $this->merge([
            'name'      => $this->name ? trim($this->name) : $this->name,
            'full_name' => $this->full_name ? trim($this->full_name) : $this->full_name,
            'address'   => $this->address ? trim($this->address) : $this->address,
            'email'     => $this->email ? strtolower(trim($this->email)) : $this->email,
        ]);

        // 3. Mapping confirm_password (FE) → password_confirmation (Laravel standard)
        if ($this->has('confirm_password')) {
            $this->merge([
                'password_confirmation' => $this->confirm_password,
            ]);
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
                'regex:/^[a-zA-Z0-9\s.\-]+$/',
                ],
                'business_type_id' => [
                    'required',
                    'integer',
                    Rule::exists('Ms_business_types', 'id')->where('is_active', true),
                    ],
                    'address' => [
                        'required',
                        'string',
                        'min:10',
                        'max:500',
                        'regex:/^[a-zA-Z0-9\s.\-]+$/',
                        ],

                        // --- VALIDASI EMPLOYEE (OWNER) ---
                        'full_name' => [
                            'required',
                            'string',
                            'min:3',
                            'max:100', // sesuai varchar(100) di ms_employees
                            'regex:/^[a-zA-Z0-9\s.\-]+$/',
            ],

            // --- VALIDASI USER (OWNER) ---
            'email' => [
                'required',
                'email:rfc,dns',
                'max:150',
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
                'confirmed',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            // Tenant
            'name.required'             => 'Nama bisnis wajib diisi.',
            'name.min'                  => 'Nama bisnis minimal 3 karakter.',
            'name.regex'                => 'Nama bisnis hanya boleh huruf, angka, titik, atau strip.',
            'business_type_id.required' => 'Silakan pilih jenis bisnis Anda.',
            'business_type_id.exists'   => 'Jenis bisnis tidak terdaftar atau tidak aktif.',
            'address.required'          => 'Alamat outlet wajib diisi lengkap.',
            'address.min'               => 'Alamat terlalu singkat, minimal 10 karakter.',

            // Employee
            'full_name.required'        => 'Nama lengkap owner wajib diisi.',
            'full_name.min'             => 'Nama lengkap minimal 3 karakter.',
            'full_name.max'             => 'Nama lengkap maksimal 100 karakter.',

            // User
            'email.required'            => 'Email login wajib diisi.',
            'email.email'               => 'Format email tidak valid.',
            'email.unique'              => 'Email ini sudah digunakan oleh bisnis lain.',
            'phone.required'            => 'Nomor WhatsApp/HP wajib diisi.',
            'phone.min'                 => 'Nomor HP minimal 10 digit.',
            'password.required'         => 'Password wajib diisi.',
            'password.min'              => 'Password minimal harus 8 karakter.',
            'password.confirmed'        => 'Konfirmasi password tidak sesuai.',
        ];
    }
}
