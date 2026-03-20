<?php

namespace App\Http\Requests;

use App\Helpers\CryptoHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
{
    // ── 1. Authorize ──────────────────────────────────────────────────────────
    public function authorize(): bool
    {
        return Auth::check();
    }

    // ── 2. Decrypt ID dari route (dipakai saat update) ────────────────────────
    protected function prepareForValidation(): void
    {
        $routeId = $this->route('id') ?? $this->route('customer');

        $this->merge([
            'id' => $routeId ? (int) CryptoHelper::decrypt($routeId) : null,
        ]);
    }

    // ── 3. Rules ──────────────────────────────────────────────────────────────
    public function rules(): array
    {
        $customerId = $this->id;
        $user       = Auth::user();
        $tenantId   = $user->tenant_id ?? $user->employee?->tenant_id;

        if (!$tenantId) {
            abort(403, 'Akses ditolak: Profil Anda tidak terhubung ke Tenant manapun.');
        }

        return [
            'id' => 'nullable|integer',

            // ── Nama ──────────────────────────────────────────────────────────
            'name' => [
                'required', 'string', 'max:100',
                // Hanya huruf, spasi, apostrof, titik, dan strip — pola EmployeeRequest
                'regex:/^[a-zA-Z\s\'.\-]+$/',
                'not_regex:/(http|https|www|\.com|\.net|\.id|\.io|\.gov)/i',
                function ($attribute, $value, $fail) {
                    if (preg_match('/(.)\1{4,}/', $value)) {
                        $fail('Nama tidak valid (terdeteksi pengulangan karakter berlebih).');
                    }
                },
            ],

            // ── Phone — unik per tenant ───────────────────────────────────────
            'phone' => [
                'required',
                'numeric',
                'digits_between:10,15',
                // Unique per tenant, ignore diri sendiri saat update
                Rule::unique('Ms_customers', 'phone')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('deleted_at')
                    ->ignore($customerId),
            ],

            // ── Email — opsional ──────────────────────────────────────────────
            'email' => [
                'nullable', 'string', 'email', 'max:100',
                Rule::unique('Ms_customers', 'email')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('deleted_at')
                    ->ignore($customerId),
            ],

            // ── Alamat ────────────────────────────────────────────────────────
            'address' => [
                'nullable', 'string', 'max:500',
                // Tolak script / HTML
                'not_regex:/<[^>]*>/',
                'not_regex:/(http|https|www)/i',
                'not_regex:/[<>{}\[\]\\\\`]/',
            ],

            // ── Gender ────────────────────────────────────────────────────────
            'gender' => [
                'nullable',
                Rule::in(['L', 'P']),
            ],

            // ── Status ────────────────────────────────────────────────────────
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    // ── 4. Messages ───────────────────────────────────────────────────────────
    public function messages(): array
    {
        return [
            'name.required'          => 'Nama pelanggan wajib diisi.',
            'name.regex'             => 'Nama hanya boleh mengandung huruf dan karakter nama standar.',
            'name.not_regex'         => 'Nama tidak boleh mengandung link atau URL.',
            'phone.required'         => 'Nomor telepon wajib diisi.',
            'phone.numeric'          => 'Nomor telepon harus berupa angka.',
            'phone.digits_between'   => 'Nomor telepon harus 10 sampai 15 digit.',
            'phone.unique'           => 'Nomor telepon sudah terdaftar untuk pelanggan lain.',
            'email.email'            => 'Format email tidak valid.',
            'email.unique'           => 'Email sudah terdaftar untuk pelanggan lain.',
            'address.not_regex'      => 'Alamat mengandung karakter yang tidak diizinkan.',
            'gender.in'              => 'Gender tidak valid. Pilih L atau P.',
        ];
    }

    // ── 5. failedValidation — pola identik PaymentUpdateRequest ──────────────
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $response = response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
            'errors'  => $validator->errors(),
        ], 422);

        throw new \Illuminate\Validation\ValidationException($validator, $response);
    }
}
