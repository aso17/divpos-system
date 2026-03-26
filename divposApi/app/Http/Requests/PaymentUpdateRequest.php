<?php

namespace App\Http\Requests;

use App\Helpers\CryptoHelper;
use App\Models\Tr_Transaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PaymentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Pastikan user login dan merupakan employee (punya tenant_id)
        return Auth::check() && !is_null(Auth::user()->employee);
    }

    protected function prepareForValidation()
    {
        // Decrypt ID dari frontend sebelum masuk ke rules()
        $this->merge([
            'transaction_id'    => CryptoHelper::decrypt($this->transaction_id),
            'payment_method_id' => $this->payment_method_id ? CryptoHelper::decrypt($this->payment_method_id) : null,
        ]);
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->employee->tenant_id;

        return [
            'transaction_id' => [
                'required', 'integer',
                // Pastikan transaksi milik tenant yang bersangkutan
                Rule::exists('Tr_transactions', 'id')->where('tenant_id', $tenantId)
            ],
            'payment_amount' => 'required|numeric|min:1',
            'payment_method_id' => [
                'required', // WAJIB: Agar record pelunasan jelas sumber dananya (Tunai/QRIS)
                'integer',
                // Pastikan metode pembayaran terdaftar di sistem
                Rule::exists('Ms_payment_methods', 'id')
            ],
            'notes' => 'nullable|string|max:255'
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->any()) {
                return;
            }

            $transaction = Tr_Transaction::find($this->transaction_id);

            if ($transaction) {
                // 1. Validasi Status Pembayaran
                if ($transaction->payment_status === Tr_Transaction::PAY_PAID) {
                    $validator->errors()->add('transaction_id', 'Transaksi ini sudah lunas.');
                    return;
                }

                // 2. Validasi Nominal (Harus melunasi sisa tagihan)
                $remaining = (float) ($transaction->grand_total - $transaction->total_paid);
                $inputAmount = (float) $this->payment_amount;

                // Mas A_so pakai validasi 'harus lunas sekaligus'
                if ($inputAmount < $remaining) {
                    $formattedRemaining = number_format($remaining, 0, ',', '.');
                    $validator->errors()->add(
                        'payment_amount',
                        "Nominal pembayaran minimal Rp {$formattedRemaining} untuk melunasi piutang."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'transaction_id.exists'      => 'Data transaksi tidak valid.',
            'payment_method_id.required' => 'Metode pembayaran harus dipilih.',
            'payment_method_id.exists'   => 'Metode pembayaran tidak valid.',
            'payment_amount.required'    => 'Masukkan nominal pembayaran.',
            'payment_amount.numeric'     => 'Format nominal harus angka.',
            'payment_amount.min'         => 'Nominal tidak boleh kosong.',
        ];
    }

    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        // Standarisasi response error agar ditangkap dengan benar oleh React (Toast)
        $response = response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
            'errors'  => $validator->errors()
        ], 422);

        throw new \Illuminate\Validation\ValidationException($validator, $response);
    }
}
