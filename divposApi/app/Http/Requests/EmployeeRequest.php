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
        // Pastikan user terautentikasi
        return Auth::check(); 
    }

    protected function prepareForValidation()
    {
        $routeId = $this->route('id') ?? $this->route('employee');
        
        $this->merge([
            // Decrypt ID dari route dan outlet_id
            'id' => $routeId ? CryptoHelper::decrypt($routeId) : null,       
            'outlet_id' => ($this->outlet_id && is_string($this->outlet_id)) 
                ? CryptoHelper::decrypt($this->outlet_id) 
                : $this->outlet_id,
        ]);
    }

    public function rules(): array
    {
        $employeeId = $this->id; 
        $user = Auth::user();
        $tenantId = $user->employee?->tenant_id;

        // Validasi dasar Tenant
        if (!$user || !$tenantId) {
            abort(403, 'Akses ditolak: Profil Anda tidak terhubung ke Tenant manapun.');
        }

        // Jika sedang EDIT, pastikan data yang diedit milik Tenant yang sama
        if ($employeeId) {
            $exists = Ms_employee::where('id', $employeeId)
                                 ->where('tenant_id', $tenantId)
                                 ->exists();
                                           
            if (!$exists) {
                abort(404, 'Data karyawan tidak ditemukan atau Anda tidak memiliki akses.');
            }
        }

        return [
            'id'        => 'nullable|integer',
            'full_name' => [
                'required', 'string', 'max:100',
                'regex:/^[a-zA-Z\s\'.\-]+$/',
                'not_regex:/(http|https|www|\.com|\.net|\.id|\.io|\.gov)/i',
                function ($attribute, $value, $fail) {
                    if (preg_match('/(.)\1{4,}/', $value)) {
                        $fail('Nama tidak valid (terdeteksi pengulangan karakter berlebih).');
                    }
                },
            ],
            'phone'     => 'required|numeric|digits_between:10,15',
            'job_title' => [
                'required', 'string', 'max:50', 
               'regex:/^[a-zA-Z\s\-]+$/',
                'not_regex:/(http|https|www|\.com|\.net|\.id)/i'
            ],
            'outlet_id' => [
                'nullable',
                'integer',
                Rule::exists('Ms_outlets', 'id')->where('tenant_id', $tenantId)
            ],
            'is_active' => [
                'sometimes', 
                'boolean',
                function ($attribute, $value, $fail) use ($user, $employeeId) {
                    // Proteksi: Karyawan tidak boleh menonaktifkan dirinya sendiri
                    if ($employeeId && $user->employee_id == $employeeId && $value == false) {
                        $fail('Anda tidak dapat menonaktifkan status Anda sendiri.');
                    }
                }
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.regex'     => 'Nama hanya boleh mengandung huruf dan karakter nama standar.',
            'job_title.not_regex' => 'Jabatan tidak boleh mengandung link/URL.',
            'outlet_id.exists'    => 'Outlet tidak valid atau bukan milik bisnis Anda.',
            'phone.numeric'       => 'Nomor telepon harus berupa angka.',
            'phone.digits_between' => 'Nomor telepon harus berisikan 10 sampai 15 digit.',
        ];
    }
}