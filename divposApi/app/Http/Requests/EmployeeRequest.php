<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Ms_employee;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper;

class EmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

  protected function prepareForValidation()
{
   
    $routeId = $this->route('id') ?? $this->route('employee');
    
    $this->merge([
       
        'id' => $routeId ? CryptoHelper::decrypt($routeId) : null,       
        'outlet_id' => ($this->outlet_id && is_string($this->outlet_id)) 
            ? CryptoHelper::decrypt($this->outlet_id) 
            : $this->outlet_id,
            
        'role_id' => ($this->role_id && is_string($this->role_id)) 
            ? CryptoHelper::decrypt($this->role_id) 
            : $this->role_id,
    ]);
}

    public function rules(): array
    {
        // Gunakan data yang sudah di-merge di atas
        $employeeId = $this->id; 
        $user = Auth::user();
        $tenantId = $user->employee?->tenant_id;

        if (!$user || !$tenantId) {
            abort(403, 'Akses ditolak: Profil Anda tidak terhubung ke Tenant manapun.');
        }

        $userId = null;
        if ($employeeId) {
            $employeeTarget = Ms_employee::where('id', $employeeId)
                                         ->where('tenant_id', $tenantId)
                                         ->first();
                                         
            if (!$employeeTarget) {
                abort(404, 'Data karyawan tidak ditemukan atau Anda tidak memiliki akses.');
            }
            $userId = $employeeTarget->user_id;
        }

        return [
            
            'id'        => 'nullable|integer',
            
            'full_name' => [
                'required', 'string', 'max:100',
                'regex:/^[a-zA-Z\s\'.]+$/' 
            ],
            'phone' => 'required|numeric|digits_between:10,15',
            'job_title' => [
                'required', 'string', 'max:50', 
                'not_regex:/^(http|https|www)/i' 
            ],
            
            
            'outlet_id' => [
                'nullable',
                'integer',
                Rule::exists('Ms_outlets', 'id')->where('tenant_id', $tenantId)
            ],

            'is_active' => 'sometimes|boolean',
            'has_login' => 'sometimes|boolean',
            
            'email' => [
                Rule::requiredIf($this->has_login === true || $this->has_login === 'true'),
                'nullable',
                'email:rfc,dns',
                Rule::unique('Ms_users', 'email')->ignore($userId),
            ],

            'password' => [
                Rule::requiredIf(!$employeeId && ($this->has_login === true || $this->has_login === 'true')),
                'nullable',
                'min:6',
                'max:20'
            ],


            'role_id' => [
                Rule::requiredIf($this->has_login === true || $this->has_login === 'true'),
                'nullable',
                'integer',
                Rule::exists('Ms_roles', 'id')->where('tenant_id', $tenantId)
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.regex' => 'Nama tidak boleh mengandung URL atau karakter aneh, Mas.',
            'job_title.not_regex' => 'Jabatan tidak boleh mengandung link/URL.',
            'outlet_id.exists' => 'Outlet tidak valid atau bukan milik bisnis Anda.',
            'email.unique' => 'Email ini sudah terdaftar untuk pengguna lain.',
            'password.required_if' => 'Password wajib diisi jika akses login diaktifkan.',
            'role_id.required_if' => 'Role wajib dipilih jika akses login diaktifkan.',
        ];
    }
}