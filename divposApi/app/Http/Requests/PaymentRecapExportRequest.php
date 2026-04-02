<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentRecapExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'keyword'           => ['sometimes', 'nullable', 'string', 'max:100'],
            'outlet_id'         => ['sometimes', 'nullable', 'integer', 'exists:Ms_outlets,id'],
            'payment_method_id' => ['sometimes', 'nullable', 'integer', 'exists:Ms_payment_methods,id'],
            'payment_status'    => ['sometimes', 'nullable', 'string', 'in:PAID,PARTIAL,UNPAID'],
            'date_from'         => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'date_to'           => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'date_from' => $this->input('date_from', now()->startOfMonth()->toDateString()),
            'date_to'   => $this->input('date_to', now()->toDateString()),
        ]);
    }
}
