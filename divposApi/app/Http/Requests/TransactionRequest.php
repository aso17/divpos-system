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
        // Pastikan user punya profil employee/tenant
        return Auth::check() && !is_null(Auth::user()->employee);
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'outlet_id'         => CryptoHelper::decrypt($this->outlet_id),
            'payment_method_id' => CryptoHelper::decrypt($this->payment_method_id),
            'tenant_id'         => Auth::user()->employee->tenant_id,
            'customer_id'       => $this->input('customer.id') ? CryptoHelper::decrypt($this->input('customer.id')) : null,
        ]);

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
            'customer.id'     => 'nullable|integer',
            'customer.is_new' => 'required|boolean',
            'customer.name'   => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9\s.]+$/'],
            'customer.phone'  => 'nullable|string|min:10|max:15|regex:/^[0-9]+$/',
            'items'           => 'required|array|min:1',
            'items.*.package_id' => [
                'required', 'integer',
                Rule::exists('Ms_packages', 'id')->where('tenant_id', $tenantId)
            ],
            'items.*.qty'    => 'required|numeric|min:0.01',
            'payment_amount' => 'required|numeric|min:0',
            'dp_amount'      => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Logic tambahan setelah aturan dasar terpenuhi
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->any()) return;

            // Ambil data payment method dari DB berdasarkan ID yang sudah didekripsi
            $method = Ms_PaymentMethod::find($this->payment_method_id);

            if ($method) {
                $totalPaid = (float)$this->payment_amount + (float)$this->dp_amount;

                // Jika metode pembayaran TIDAK mengizinkan bayar nol (bukan piutang)
                // Tapi total bayar (DP + Payment) malah 0 atau kurang
                if (!$method->allow_zero_pay && $totalPaid <= 0) {
                    $validator->errors()->add(
                        'payment_amount', 
                        "Pembayaran dengan {$method->name} tidak boleh nol. Masukkan nominal bayar atau DP."
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