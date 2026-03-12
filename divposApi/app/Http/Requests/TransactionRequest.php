<?php

namespace App\Http\Requests;

use App\Helpers\CryptoHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Pastikan user punya profil employee/tenant
        return Auth::check() && !is_null(Auth::user()->employee);
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'outlet_id'         => CryptoHelper::decrypt($this->outlet_id),
            'payment_method_id' => CryptoHelper::decrypt($this->payment_method_id),
            'tenant_id' => Auth::user()->employee->tenant_id,
            // Jika ada customer_id (pelanggan lama)
            'customer_id'       => $this->input('customer.id') ? CryptoHelper::decrypt($this->input('customer.id')) : null,
        ]);

        // Dekripsi ID di dalam array items
        if (is_array($this->items)) {
            $decryptedItems = array_map(function ($item) {
                if (isset($item['package_id'])) {
                    $item['package_id'] = CryptoHelper::decrypt($item['package_id']);
                }
                return $item;
            }, $this->items);

            $this->merge(['items' => $decryptedItems]);
        }
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->employee->tenant_id;

        return [
            // 1. Context Validation

            'tenant_id' => 'required|integer',
            'outlet_id' => [
                'required', 'integer',
                Rule::exists('Ms_outlets', 'id')->where('tenant_id', $tenantId)
            ],
            'payment_method_id' => [
                'required', 'integer',
                Rule::exists('Ms_payment_methods', 'id') // Payment method bisa global/tenant-specific
            ],

            // 2. Customer Validation (Flexible untuk Guest Checkout)
            'customer.id'     => 'nullable|integer',
            'customer.is_new' => 'required|boolean',
            'customer.name'   => [
                'nullable', 'string', 'max:100',
                'regex:/^[a-zA-Z0-9\s.]+$/', // Hanya alphanumeric, spasi, titik
            ],
            'customer.phone'  => 'nullable|string|min:10|max:15|regex:/^[0-9]+$/',

            // 3. Items Validation (Logic Kritis)
            'items' => 'required|array|min:1',
            'items.*.package_id' => [
                'required', 'integer',
                // Proteksi: Paket harus milik tenant yang sama
                Rule::exists('Ms_packages', 'id')->where('tenant_id', $tenantId)
            ],
            'items.*.qty' => 'required|numeric|min:0.01',

            // 4. Payment Validation
            'payment_amount' => 'required|numeric|min:0',
            'dp_amount'      => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'outlet_id.exists'         => 'Outlet tidak valid atau bukan milik Anda.',
            'items.*.package_id.exists' => 'Salah satu layanan tidak ditemukan di bisnis Anda.',
            'items.*.qty.min'          => 'Jumlah/berat tidak boleh nol.',
            'customer.name.regex'      => 'Nama pelanggan mengandung karakter ilegal.',
            'customer.phone.regex'     => 'Nomor telepon hanya boleh angka.',
        ];
    }

    /**
     * Handle kegagalan validasi agar kursor tidak macet di frontend
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        $response = response()->json([
            'status'  => 'error',
            'message' => $validator->errors()->first(),
            'errors'  => $validator->errors()
        ], 422);

        throw new \Illuminate\Validation\ValidationException($validator, $response);
    }
}