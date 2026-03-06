<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class RoleRequest extends FormRequest
{
    protected $tenantId;

    public function authorize(): bool
    {
        $this->tenantId = Auth::user()?->tenant_id;
        return !is_null($this->tenantId);
    }

    protected function prepareForValidation()
    {
       
        $routeId = collect($this->route()->parameters())->first();
        
        $sanitizedData = [];

        if ($routeId) {
            $sanitizedData['id'] = CryptoHelper::decrypt($routeId);
        }

        if ($this->has('role_name')) {
            $sanitizedData['role_name'] = strip_tags($this->role_name);
        }
        
        if ($this->has('code')) {
            
            $sanitizedData['code'] = strtoupper(str_replace(' ', '', $this->code));
        }

        $this->merge($sanitizedData);
  }

    /**
     * Aturan validasi yang ketat
     */
    public function rules(): array
    {
        return [
            // Cek apakah Role ID yang diedit memang milik Tenant ini
            'id' => [
                'nullable',
                'integer',
                $this->id ? Rule::exists('Ms_roles', 'id')->where('tenant_id', $this->tenantId) : '',
            ],

            'role_name' => [
                'required',
                'string',
                'min:3',
                'max:100',
                'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/', 
            ],

            'code' => [
                'required',
                'string',
                'max:50',
                // Unik per tenant: Boleh ada 'ADM' di tenant lain, tapi tidak boleh double di tenant yang sama
                Rule::unique('Ms_roles', 'code')
                    ->where('tenant_id', $this->tenantId)
                    ->ignore($this->id),
            ],

            'description' => 'nullable|string|max:255',
            'is_active'   => 'boolean',
        ];
    }

    /**
     * Custom error message agar lebih user-friendly
     */
    public function messages(): array
    {
        return [
            'code.unique' => 'Kode Role ini sudah digunakan di bisnis Anda.',
            'id.exists'   => 'Akses ditolak: Data Role tidak ditemukan atau bukan milik Anda.',
        ];
    }

    /**
     * Response JSON jika validasi gagal (Integrity Check)
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Integrity Check Failed (Role)',
            'errors'  => $validator->errors()
        ], 422));
    }
}