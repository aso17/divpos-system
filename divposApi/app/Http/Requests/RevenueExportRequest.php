<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RevenueExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_from'         => ['required', 'date'],
            'date_to'           => ['required', 'date', 'after_or_equal:date_from'],
            'outlet_id'         => ['nullable', 'integer', 'exists:Ms_outlets,id'],
            'payment_status'    => ['nullable', 'string', 'in:PAID,PARTIAL,UNPAID'],
            'payment_method_id' => ['nullable', 'integer', 'exists:Ms_payment_methods,id'],
            'status'            => ['nullable', 'string', 'in:PENDING,PROCESS,DONE,CANCELLED'],
            'format'            => ['nullable', 'string', 'in:xlsx,csv'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'format' => $this->format ?? 'xlsx',
        ]);
    }
}
