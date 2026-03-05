<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Ms_outlet;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class OutletRequest extends FormRequest
{
    
    protected $tenantId;

    public function authorize(): bool
    {
        // Logic: Pastikan user terautentikasi dan memiliki tenant_id
        $this->tenantId = Auth::user()?->employee?->tenant_id;
        return $this->tenantId !== null;
    }

    protected function prepareForValidation()
    {
        $routeId = $this->route('id') ?? $this->route('outlet');
        
        // Logic Performa: Hanya proses sanitasi jika field ada di request
        $sanitizedData = [];
        
        if ($routeId) {
            $sanitizedData['id'] = CryptoHelper::decrypt($routeId);
        }

        if ($this->tenant_id && is_string($this->tenant_id)) {
            $sanitizedData['tenant_id'] = CryptoHelper::decrypt($this->tenant_id);
        }

        // Security: Lapis baja dengan strip_tags + htmlspecialchars (XSS prevention)
        $fields = ['name', 'city', 'address', 'description'];
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
            // Security: Anti-IDOR. Jika update, ID harus milik tenant_id user.
            'id' => [
                'nullable',
                'integer',
                $this->id ? Rule::exists('Ms_outlets', 'id')->where('tenant_id', $this->tenantId) : '',
            ],
            
            'tenant_id' => [
                'required',
                'integer',
                Rule::exists('Ms_tenants', 'id')
            ],
            
            'name' => [
                'required', 
                'string', 
                'min:3', 
                'max:100',
                'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/', 
            ],

            'phone' => 'required|numeric|digits_between:10,15',
            
            'city' => [
                'required', 
                'string', 
                'max:50', 
                'regex:/^[a-zA-Z\s\.\-]+$/'
            ],

            
            'address' => [
                'required', 
                'string', 
                'min:10',
                'not_regex:/<script|javascript|http|https|www|<\/|{[ ]*$/i',
            ],

            'description' => [
                'nullable', 
                'string', 
                'max:255',
                'not_regex:/<script|javascript|http|https|www|<\/|{[ ]*$/i',
            ],

            'is_active'      => 'boolean',
            'is_main_branch' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'id.exists'             => 'Akses ditolak: Data tidak ditemukan atau milik entitas lain.',
            'name.regex'            => 'Nama mengandung karakter ilegal.',
            'address.not_regex'     => 'Alamat tidak diizinkan mengandung link atau script.',
            'description.not_regex' => 'Deskripsi tidak diizinkan mengandung link atau script.',
            'phone.numeric'         => 'Nomor telepon wajib angka.',
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