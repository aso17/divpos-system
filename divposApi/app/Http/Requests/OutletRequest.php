<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class OutletRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Langsung return boolean, lebih clean
        return Auth::check() && !is_null(Auth::user()->tenant_id);
    }

    protected function prepareForValidation()
    {
        $routeId = $this->route('id') ?? $this->route('outlet');
        $tenantId = Auth::user()->tenant_id;

        $mergeData = [
            'tenant_id' => $tenantId,
        ];

        // 1. Dekripsi ID jika ada (Edit Mode)
        if ($routeId) {
            $mergeData['id'] = CryptoHelper::decrypt($routeId);
        }

        // 2. Sanitasi Text Otomatis
        $textFields = ['name', 'city', 'address', 'description'];
        foreach ($textFields as $field) {
            if ($this->has($field)) {
                // Hapus tag HTML & Spasi berlebih (Double space jadi single)
                $cleanValue = preg_replace('/\s+/', ' ', strip_tags(trim($this->$field)));
                $mergeData[$field] = $cleanValue;
            }
        }

        // 3. Konversi Boolean (Jika kiriman dari FE berupa string "true"/"1")
        $boolFields = ['is_active', 'is_main_branch'];
        foreach ($boolFields as $field) {
            if ($this->has($field)) {
                $mergeData[$field] = filter_var($this->$field, FILTER_VALIDATE_BOOLEAN);
            }
        }

        $this->merge($mergeData);
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('Ms_outlets', 'id')->where('tenant_id', $tenantId)
            ],
            
            'name' => [
                'required', 'string', 'min:3', 'max:100',
                'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/',
                'not_regex:/(http|https|www|\.com|\.net|\.id)/i'
            ],

            'phone' => 'required|numeric|digits_between:10,15',

            'city' => [
                'required', 'string', 'max:50', 
                'regex:/^[a-zA-Z\s\.\-]+$/', 
            ],
            
            'address' => [
                'required', 'string', 'min:10',
                'regex:/^[a-zA-Z0-9\s.,\/()\-]+$/',
                'not_regex:/[<>"{}]/i',
            ],

            'description' => [
                'nullable', 'string', 'max:255',
                'not_regex:/[<>"{}]/i', 
                'not_regex:/(http|https|www|\.com|\.net|\.id|\.io|\.gov|\.org)/i',
    
            ],

            'is_active'      => 'boolean',
            'is_main_branch' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'id.exists'         => 'Akses ditolak: Data tidak ditemukan.',
            'name.regex'        => 'Nama mengandung karakter simbol yang dilarang.',
            'city.regex'        => 'Format nama kota tidak valid.',
            'address.regex'     => 'Format alamat tidak valid.',
            'address.not_regex' => 'Alamat tidak boleh mengandung link atau script.',
            'phone.numeric'     => 'Nomor telepon harus berupa angka.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Integrity Check Failed',
            'errors'  => $validator->errors()
        ], 422));
    }
}