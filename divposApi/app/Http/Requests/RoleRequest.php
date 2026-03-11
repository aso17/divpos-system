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
    public function authorize(): bool
    {
        // Gunakan employee tenant_id agar konsisten dengan Master lainnya
        return Auth::check() && !is_null(Auth::user()->employee?->tenant_id);
    }

    protected function prepareForValidation()
    {
        $tenantId = Auth::user()->employee->tenant_id;
        $routeId = $this->route('id') ?? $this->route('role');
        
        $mergeData = [
            'tenant_id' => $tenantId,
        ];

        // 1. Dekripsi ID
        if ($routeId) {
            $mergeData['id'] = CryptoHelper::decrypt($routeId);
        }

        // 2. Sanitasi Role Name (Huruf depan Kapital per kata)
        if ($this->has('role_name')) {
            $mergeData['role_name'] = ucwords(preg_replace('/\s+/', ' ', strip_tags(trim($this->role_name))));
        }
        
        // 3. Sanitasi Code (Hapus spasi, Paksa Uppercase, hanya Alfanumerik & Underscore)
        if ($this->has('code')) {
            $mergeData['code'] = strtoupper(preg_replace('/[^a-zA-Z0-9_]/', '', $this->code));
        }

        // 4. Sanitasi Description
        if ($this->has('description')) {
            $mergeData['description'] = strip_tags(trim($this->description));
        }

        // 5. Konversi Boolean
        if ($this->has('is_active')) {
            $mergeData['is_active'] = filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        $this->merge($mergeData);
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->employee->tenant_id;
        $id = $this->id;

        return [
            'id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('Ms_roles', 'id')->where('tenant_id', $tenantId)
            ],

            'role_name' => [
                'required', 'string', 'min:3', 'max:100',
                'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/', 
                'not_regex:/(http|https|www|\.com|\.net|\.id)/i'
            ],

            'code' => [
                'required', 'string', 'max:50',
                // Pastikan format code hanya alfanumerik dan underscore (Contoh: ADMIN_OUTLET)
                'regex:/^[A-Z0-9_]+$/',
                Rule::unique('Ms_roles', 'code')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('deleted_at')
                    ->ignore($id),
            ],

            'description' => [
                'nullable', 'string', 'max:255',
                'not_regex:/[<>"{}]/i', 
                'not_regex:/(http|https|www|\.com|\.net|\.id)/i'
            ],
            
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'code.unique' => 'Kode Role ini sudah digunakan di bisnis Anda.',
            'code.regex'  => 'Format kode harus huruf besar dan hanya boleh mengandung underscore (_).',
            'id.exists'   => 'Akses ditolak: Data Role tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Integrity Check Failed (Role)',
            'errors'  => $validator->errors()
        ], 422));
    }
}