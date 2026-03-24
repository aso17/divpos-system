<?php

namespace App\Http\Requests;

use App\Helpers\CryptoHelper;
use App\Models\Ms_PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && !is_null(Auth::user()->employee);
    }

    protected function prepareForValidation()
    {
        // 1. Ambil data customer asli dari input
        $customer = $this->input('customer');

        // 2. Dekripsi ID customer jika ada (agar lolos validasi 'integer')
        if (!empty($customer['id'])) {
            $customer['id'] = CryptoHelper::decrypt($customer['id']);
        }

        // 3. Merge semua data yang didekripsi
        $this->merge([
            'tenant_id'         => Auth::user()->employee->tenant_id,
            'outlet_id'         => CryptoHelper::decrypt($this->outlet_id),
            'payment_method_id' => CryptoHelper::decrypt($this->payment_method_id),
            'customer'          => $customer, // Data customer yang sudah didekripsi ID-nya
            'customer_id'       => $customer['id'] ?? null // Shortcut untuk mempermudah di Controller
        ]);

        // 4. Dekripsi Item Packages
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
            'tenant_id' => 'required|integer',
            'outlet_id' => [
                'required', 'integer',
                Rule::exists('Ms_outlets', 'id')->where('tenant_id', $tenantId)
            ],
            'payment_method_id' => [
                'required', 'integer',
                Rule::exists('Ms_payment_methods', 'id')
            ],
            // Validasi customer.id sekarang aman karena sudah di-decrypt di prepareForValidation
            'customer.id'     => 'nullable|integer',
            'customer.is_new' => 'required|boolean',
            'customer.name'   => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9\s.]+$/'],
            'customer.phone'  => 'nullable|string|min:10|max:15|regex:/^[0-9]+$/',

            'items'              => 'required|array|min:1',
            'items.*.package_id' => [
                'required', 'integer',
                Rule::exists('Ms_packages', 'id')->where('tenant_id', $tenantId)
            ],
            'items.*.qty'    => 'required|numeric|min:0.01',
            'payment_amount' => 'required|numeric|min:0',
            'dp_amount'      => 'nullable|numeric|min:0',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->any()) {
                return;
            }

            $method = Ms_PaymentMethod::find($this->payment_method_id);

            if ($method) {
                $dp = (float)$this->dp_amount;
                $pay = (float)$this->payment_amount;
                $totalInput = $dp + $pay;

                // Validasi kewajiban bayar
                if (!$method->allow_zero_pay && $totalInput <= 0) {
                    $validator->errors()->add(
                        'payment_amount',
                        "Metode {$method->name} mewajibkan pembayaran. Masukkan nominal bayar atau DP."
                    );
                }

                // Validasi izin DP
                if ($dp > 0 && !$method->is_dp_enabled) {
                    $validator->errors()->add(
                        'dp_amount',
                        "Metode {$method->name} tidak mendukung pembayaran DP (Uang Muka)."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'outlet_id.exists'          => 'Outlet tidak valid atau bukan milik Anda.',
            'items.*.package_id.exists' => 'Salah satu layanan tidak ditemukan di bisnis Anda.',
            'items.*.qty.min'           => 'Jumlah/berat tidak boleh nol.',
            'customer.id.integer'       => 'ID Pelanggan tidak valid.',
            'customer.name.regex'       => 'Nama pelanggan mengandung karakter ilegal.',
            'customer.phone.regex'      => 'Nomor telepon hanya boleh angka.',
        ];
    }

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
