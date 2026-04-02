<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RevenueReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_from'        => ['required', 'date'],
            'date_to'          => ['required', 'date', 'after_or_equal:date_from'],
            'outlet_id'        => ['nullable', 'integer', 'exists:Ms_outlets,id'],
            'payment_status'   => ['nullable', 'string', 'in:PAID,PARTIAL,UNPAID'],
            'payment_method_id' => ['nullable', 'integer', 'exists:Ms_payment_methods,id'],
            'status'           => ['nullable', 'string', 'in:PENDING,PROCESS,DONE,CANCELLED'],
            'search'           => ['nullable', 'string', 'max:100'],
            'per_page'         => ['nullable', 'integer', 'in:15,25,50,100'],
            'sort_by'          => ['nullable', 'string', 'in:order_date,grand_total,invoice_no,customer_name'],
            'sort_dir'         => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_to.after_or_equal' => 'Tanggal akhir harus sama atau setelah tanggal awal.',
        ];
    }

    /**
     * Prepare the data for validation.
     * Inject tenant_id from authenticated user so controller stays clean.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'per_page' => $this->per_page ?? 15,
            'sort_by'  => $this->sort_by  ?? 'order_date',
            'sort_dir' => $this->sort_dir ?? 'desc',
        ]);
    }
}
