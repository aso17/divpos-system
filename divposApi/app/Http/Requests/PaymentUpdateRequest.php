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
        return Auth::check() && !is_null(Auth::user()->employee);
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'transaction_id'    => CryptoHelper::decrypt($this->transaction_id),
            // Jika dikirim dari React, kita dekripsi. Jika tidak, biarkan null.
            'payment_method_id' => $this->payment_method_id ? CryptoHelper::decrypt($this->payment_method_id) : null,
        ]);
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->employee->tenant_id;

        return [
            'transaction_id' => [
                'required', 'integer',
                Rule::exists('Tr_transactions', 'id')->where('tenant_id', $tenantId)
            ],
            'payment_amount' => 'required|numeric|min:1',
            // DIUBAH: Sekarang nullable karena Mas A_so mau pakai default dari table transaksi
            'payment_method_id' => [
                'nullable', 'integer',
                Rule::exists('Ms_payment_methods', 'id')
            ],
            'notes' => 'nullable|string|max:255'
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->any()) return;

            $transaction = Tr_Transaction::find($this->transaction_id);

            if ($transaction) {
                // 1. Cek Status Lunas
                if ($transaction->payment_status === Tr_Transaction::PAY_PAID) {
                    $validator->errors()->add('transaction_id', 'Transaksi ini sudah lunas.');
                    return;
                }

                // 2. Cek Sisa Tagihan
                $remaining = (float) ($transaction->grand_total - $transaction->total_paid);
                $inputAmount = (float) $this->payment_amount;

                if ($inputAmount < $remaining) {
                    $formattedRemaining = number_format($remaining, 0, ',', '.');
                    $validator->errors()->add(
                        'payment_amount', 
                        "Nominal pembayaran kurang. Sisa tagihan adalah Rp {$formattedRemaining}."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'transaction_id.exists'   => 'Transaksi tidak ditemukan.',
            'payment_amount.required' => 'Masukkan nominal pembayaran.',
            'payment_amount.min'      => 'Nominal tidak valid.',
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