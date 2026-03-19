<?php

namespace App\Http\Requests;

use App\Helpers\CryptoHelper;
use App\Models\Tr_Transaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CancelTransactionRequest extends FormRequest
{
    // ── 1. Authorize ──────────────────────────────────────────────────────────
    public function authorize(): bool
    {
        return Auth::check() && !is_null(Auth::user()->employee);
    }

    // ── 2. Decrypt ID ─────────────────────────────────────────────────────────
    protected function prepareForValidation(): void
    {
        $this->merge([
            'transaction_id' => CryptoHelper::decrypt($this->transaction_id),
        ]);
    }

    // ── 3. Rules ──────────────────────────────────────────────────────────────
    public function rules(): array
    {
        $tenantId = Auth::user()->employee->tenant_id;

        return [
            'transaction_id' => [
                'required',
                'integer',
                Rule::exists('Tr_transactions', 'id')->where('tenant_id', $tenantId),
            ],

            'reason' => [
                'required',
                'string',
                'min:10',
                'max:200',

                // Tolak tag HTML & script
                'not_regex:/<[^>]*>/',

                // Tolak URL / link
                'not_regex:/(http|https|www|\.com|\.net|\.id|\.io|\.gov)/i',

                // Tolak karakter berbahaya: kurung kurawal, backslash, backtick, tanda kurung siku
                'not_regex:/[<>{}\[\]\\\\`]/',

                // Tolak SQL injection keyword umum
                'not_regex:/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|FROM|WHERE)\b/i',

                // Closure 1: cegah spam karakter berulang (contoh: "aaaaaa")
                function ($attribute, $value, $fail) {
                    if (preg_match('/(.)\1{5,}/', $value)) {
                        $fail('Alasan tidak valid (terdeteksi pengulangan karakter berlebih).');
                    }
                },

                // Closure 2: minimal 2 kata — cegah input asal satu kata
                function ($attribute, $value, $fail) {
                    if (str_word_count(strip_tags(trim($value))) < 2) {
                        $fail('Alasan harus terdiri dari minimal 2 kata.');
                    }
                },
            ],
        ];
    }

    // ── 4. Business rule validation ───────────────────────────────────────────
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->any()) {
                return;
            }

            $transaction = Tr_Transaction::find($this->transaction_id);

            if (!$transaction) {
                return;
            }

            // Guard 1: hanya PENDING & PROCESS yang boleh dibatalkan
            $cancelableStatuses = [
                Tr_Transaction::STATUS_PENDING,
                Tr_Transaction::STATUS_PROCESS,
            ];

            if (!in_array($transaction->status, $cancelableStatuses)) {
                $validator->errors()->add(
                    'transaction_id',
                    "Transaksi dengan status '{$transaction->status}' tidak dapat dibatalkan."
                );
                return;
            }

            // Guard 2: transaksi PAID tidak bisa dibatalkan
            if ($transaction->payment_status === Tr_Transaction::PAY_PAID) {
                $validator->errors()->add(
                    'transaction_id',
                    'Transaksi yang sudah LUNAS tidak dapat dibatalkan. Gunakan proses refund.'
                );
            }
        });
    }

    // ── 5. Messages ───────────────────────────────────────────────────────────
    public function messages(): array
    {
        return [
            'transaction_id.required' => 'ID transaksi wajib diisi.',
            'transaction_id.exists'   => 'Transaksi tidak ditemukan.',
            'reason.required'         => 'Alasan pembatalan wajib diisi.',
            'reason.min'              => 'Alasan minimal 10 karakter.',
            'reason.max'              => 'Alasan maksimal 200 karakter.',
            'reason.not_regex'        => 'Alasan mengandung karakter atau kata yang tidak diizinkan.',
        ];
    }

    // ── 6. failedValidation ───────────────────────────────────────────────────
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
