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
    // Public agar bisa diakses langsung oleh Controller tanpa re-query
    public $tenantId;

    public function authorize(): bool
    {
        // Pastikan tenant_id tersedia
        return !is_null($this->tenantId);
    }

    protected function prepareForValidation()
    {
        // 1. KRUSIAL: Ambil tenant_id di awal lifecycle agar tersedia untuk sanitize & rules
        $this->tenantId = Auth::user()?->employee?->tenant_id;

        $routeId = $this->route('id') ?? $this->route('category');
        $sanitizedData = [];
        
        // 2. Dekripsi ID Kategori
        if ($routeId && !is_numeric($routeId)) {
            $sanitizedData['id'] = CryptoHelper::decrypt($routeId);
        }

        // 3. Pasang tenant_id ke dalam data request
        $sanitizedData['tenant_id'] = $this->tenantId;

        // 4. Sanitasi Input (XSS Prevention)
        if ($this->has('name')) {
            $cleanName = trim(strip_tags($this->name));
            $sanitizedData['name'] = htmlspecialchars($cleanName, ENT_QUOTES, 'UTF-8');
            
            // Auto-generate slug jika kosong
            if (!$this->has('slug') || empty($this->slug)) {
                $sanitizedData['slug'] = Str::slug($cleanName);
            }
        }

        if ($this->has('slug')) {
            $sanitizedData['slug'] = Str::slug($this->slug);
        }

        // Merge ke request agar divalidasi oleh rules()
        $this->merge($sanitizedData);
    }

   public function rules(): array
{
    $id = $this->id; 

    return [
        'tenant_id' => 'required|integer',
        
        'id' => [
            'nullable',
            'integer',
            $id ? Rule::exists('Ms_categories', 'id')->where('tenant_id', $this->tenantId) : '',
        ],
        'name' => [
            'required', 'string', 'min:2', 'max:100',
            'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/',
            Rule::unique('Ms_categories', 'name')
                ->where('tenant_id', $this->tenantId)
                ->whereNull('deleted_at') // <--- TAMBAHKAN INI
                ->ignore($id)
        ],
        'slug' => [
            'nullable', 'string', 'max:150',
            Rule::unique('Ms_categories', 'slug')
                ->where('tenant_id', $this->tenantId)
                ->whereNull('deleted_at') // <--- TAMBAHKAN INI JUGA
                ->ignore($id)
        ],
        'priority'  => 'integer|min:0|max:255',
        'is_active' => 'boolean',
    ];
}

    public function messages(): array
    {
        return [
            'id.exists'     => 'Akses ditolak: Data tidak ditemukan atau milik tenant lain.',
            'name.required' => 'Nama kategori wajib diisi.',
            'name.unique'   => 'Kategori ini sudah ada di daftar Anda.',
            'name.regex'    => 'Nama mengandung karakter yang tidak diizinkan.',
            'slug.unique'   => 'Slug sudah digunakan.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Integrity Check Failed',
            'errors'  => $validator->errors()
        ], 422));
    }
}