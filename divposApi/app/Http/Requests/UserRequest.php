<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Helpers\CryptoHelper;
use Illuminate\Support\Facades\Auth;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    protected function prepareForValidation()
    {
        $routeId = $this->route('id') ?? $this->route('user');
        
        $rawEmployeeId = $this->input('employee_id') ?? $this->input('employee');
        $rawRoleId = $this->input('role_id') ?? $this->input('role');

        $this->merge([
            'id' => $routeId ? CryptoHelper::decrypt($routeId) : null,
            
            'employee_id' => ($rawEmployeeId && is_string($rawEmployeeId)) 
                ? CryptoHelper::decrypt($rawEmployeeId) 
                : $rawEmployeeId,

            'role_id' => ($rawRoleId && is_string($rawRoleId)) 
                ? CryptoHelper::decrypt($rawRoleId) 
                : $rawRoleId,
            
            'is_active' => $this->has('is_active') 
                ? filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN) 
                : null,
        ]);
    }

    public function rules(): array
    {
        $userId = $this->id; 
        $userAuth = Auth::user();

        // Menggunakan Accessor yang sudah kita buat di Model Ms_user
        $isOwner = $userAuth->is_owner;
        $isEditingSelf = ($userId && $userAuth->id == $userId);

        // Logika Tenant ID
        $tenantId = $userAuth->tenant_id ?? $userAuth->employee?->tenant_id;

        if (!$tenantId) {
            abort(403, 'Akses ditolak: Identitas Bisnis (Tenant) tidak ditemukan.');
        }

        return [
            'id' => 'nullable|integer',
            
            'employee_id' => [
                'nullable', 
                'integer',
                Rule::exists('Ms_employees', 'id')->where('tenant_id', $tenantId)
            ],

            'email' => [
                'required',
                'email:rfc',
                'max:150',
                Rule::unique('Ms_users', 'email')
                    ->ignore($userId)
                    ->whereNull('deleted_at'),
            ],

            'username' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[a-zA-Z0-9._]+$/',
                Rule::unique('Ms_users', 'username')
                    ->ignore($userId) 
                    ->whereNull('deleted_at'),
            ],

            'password' => [
                $userId ? 'nullable' : 'required',
                'string',
                'min:8',
            ],

            // Lapis Baja: Role hanya wajib jika Owner sedang mengedit ORANG LAIN
            'role_id' => [
                ($isOwner && !$isEditingSelf) ? 'required' : 'nullable',
                'integer',
                Rule::exists('Ms_roles', 'id')->where('tenant_id', $tenantId)
            ],

            'avatar'    => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            
            // is_active menjadi optional (sometimes) agar tidak error saat disabled di FE
            'is_active' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'       => 'Email sudah digunakan.',
            'username.unique'    => 'Username sudah digunakan.',
            'username.regex'     => 'Username hanya boleh huruf, angka, titik, atau underscore.',
            'role_id.required'   => 'Harap tentukan role untuk user ini.',
            'role_id.exists'     => 'Role tidak valid untuk bisnis Anda.',
            'employee_id.exists' => 'Data karyawan tidak ditemukan dalam bisnis Anda.',
        ];
    }
}