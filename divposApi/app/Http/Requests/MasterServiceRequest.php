<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class MasterServiceRequest extends FormRequest
{
    protected $tenantId;

    public function authorize(): bool
    {
        $this->tenantId = Auth::user()->employee?->tenant_id;
        return !is_null($this->tenantId);
    }

    protected function prepareForValidation()
    {
        // Ambil ID dari route parameter (services/{id})
        $routeId = $this->route('id') ?? $this->route('master_service');
        $sanitizedData = [];
        
        // 1. Dekripsi ID Service & Masukkan ke Request agar bisa diakses $this->id
        if ($routeId) {
            $decryptedId = CryptoHelper::decrypt($routeId);
            // MERGE adalah kunci agar $this->id di rules() tidak null
            $this->merge(['id' => $decryptedId]); 
        }

        // 2. 🛡️ PAKSA tenant_id dari Auth
        $sanitizedData['tenant_id'] = $this->tenantId;

        // 3. Sanitasi Input Text
        $fields = ['name', 'description'];
        foreach ($fields as $field) {
            if ($this->has($field)) {
                $value = trim($this->$field);
                $sanitizedData[$field] = htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8');
            }
        }

        $this->merge($sanitizedData);
    }

    public function rules(): array
    {
        return [
            'id' => [
                'nullable',
                'integer',
                // Cek apakah ID benar milik tenant ini
                $this->id ? Rule::exists('Ms_services', 'id')->where('tenant_id', $this->tenantId) : '',
            ],
            
           'name' => [
                'required', 'string', 'min:3', 'max:100',
                'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/',
                Rule::unique('Ms_services', 'name')
                    ->where('tenant_id', $this->tenantId)
                    ->ignore($this->id), // Mengabaikan diri sendiri saat update
            ],

            'description' => [
                'nullable', 'string', 'max:200',
                'not_regex:/<script|javascript|http|https|www|<\/|{[ ]*$/i',
            ],

            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'id.exists' => 'Akses ditolak: Data tidak ditemukan atau bukan milik Anda.',
            'name.required' => 'Nama layanan wajib diisi.',
            'name.unique' => 'Nama layanan ini sudah ada di daftar outlet Anda.',
            'name.regex' => 'Nama layanan mengandung karakter yang dilarang.',
            'description.not_regex' => 'Deskripsi tidak boleh mengandung link atau script.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Integrity Check Failed (Master Layanan)',
            'errors'  => $validator->errors()
        ], 422));
    }
}