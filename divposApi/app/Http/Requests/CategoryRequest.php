<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper;
use Illuminate\Support\Str;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {

        return Auth::check() && !is_null(Auth::user()->employee?->tenant_id);
    }

    protected function prepareForValidation()
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;
        $routeId = $this->route('id') ?? $this->route('category');

        $mergeData = [
            'tenant_id' => $tenantId,
        ];

        // 1. Dekripsi ID
        if ($routeId) {
            $mergeData['id'] = CryptoHelper::decrypt($routeId);
        }

        // 2. Sanitasi Nama & Generate Slug
        if ($this->has('name')) {
            $cleanName = preg_replace('/\s+/', ' ', strip_tags(trim($this->name)));
            $mergeData['name'] = $cleanName;


            if (empty($this->slug)) {
                $mergeData['slug'] = Str::slug($cleanName);
            }
        }


        if ($this->has('slug') && !empty($this->slug)) {
            $mergeData['slug'] = Str::slug($this->slug);
        }

        // 4. Konversi Boolean
        if ($this->has('is_active')) {
            $mergeData['is_active'] = filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        $this->merge($mergeData);
    }

    public function rules(): array
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?? $user->employee?->tenant_id;
        $id = $this->id;

        return [
            'tenant_id' => 'required|integer',
            'id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('Ms_categories', 'id')->where('tenant_id', $tenantId)
            ],
            'name' => [
                'required', 'string', 'min:2', 'max:100',
                'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/',
                Rule::unique('Ms_categories', 'name')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('deleted_at')
                    ->ignore($id)
            ],
            'slug' => [
                'required', 'string', 'max:150',
                Rule::unique('Ms_categories', 'slug')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('deleted_at')
                    ->ignore($id)
            ],
            'priority'  => 'nullable|integer|min:0|max:255',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'id.exists'     => 'Akses ditolak: Data tidak ditemukan.',
            'name.required' => 'Nama kategori wajib diisi.',
            'name.unique'   => 'Nama kategori ini sudah terdaftar.',
            'name.regex'    => 'Nama kategori mengandung simbol yang dilarang.',
            'slug.unique'   => 'Slug kategori sudah digunakan, silakan buat nama yang sedikit berbeda.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Integrity Check Failed (Category)',
            'errors'  => $validator->errors()
        ], 422));
    }
}
