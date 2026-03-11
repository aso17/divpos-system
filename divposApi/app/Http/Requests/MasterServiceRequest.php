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
    public function authorize(): bool
    {
        // Pastikan tenant_id aman
        return Auth::check() && !is_null(Auth::user()->employee?->tenant_id);
    }

    protected function prepareForValidation()
    {
        $routeId = $this->route('id') ?? $this->route('master_service');
        $tenantId = Auth::user()->employee->tenant_id;

        $mergeData = [
            'tenant_id' => $tenantId,
        ];

        // 1. Dekripsi ID
        if ($routeId) {
            $mergeData['id'] = CryptoHelper::decrypt($routeId);
        }

        // 2. Sanitasi Nama & Deskripsi
        // Kita gunakan strip_tags & trim saja agar karakter asli di DB tetap bersih (bukan hasil htmlspecialchars)
        if ($this->has('name')) {
            $mergeData['name'] = preg_replace('/\s+/', ' ', strip_tags(trim($this->name)));
        }

        if ($this->has('description')) {
            $mergeData['description'] = strip_tags(trim($this->description));
        }

        // 3. Pastikan is_active jadi boolean murni
        if ($this->has('is_active')) {
            $mergeData['is_active'] = filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        $this->merge($mergeData);
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->employee->tenant_id;

        return [
            'id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('Ms_services', 'id')->where('tenant_id', $tenantId)
            ],
            
            'name' => [
                'required', 'string', 'min:3', 'max:100',
                // Whitelist: Huruf, angka, spasi, titik, koma, strip, apostrof, kurung
                'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/',
                // Pastikan tidak ada link
                'not_regex:/(http|https|www|\.com|\.net|\.id)/i',
                // Unique per Tenant
                Rule::unique('Ms_services', 'name')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('deleted_at')
                    ->ignore($this->id),
            ],

            'description' => [
                'nullable', 'string', 'max:200',
                // Proteksi URL & Script untuk deskripsi
                'not_regex:/(http|https|www|\.com|\.net|\.id)/i',
                'not_regex:/[<>"{}]/i',
            ],

            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'id.exists'             => 'Data layanan tidak ditemukan atau akses ditolak.',
            'name.required'         => 'Nama layanan wajib diisi.',
            'name.unique'           => 'Nama layanan ini sudah terdaftar di bisnis Anda.',
            'name.regex'            => 'Nama layanan mengandung simbol yang tidak diizinkan.',
            'description.not_regex' => 'Deskripsi dilarang mengandung link (URL) atau simbol kode (XSS).',
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