<?php

namespace App\Http\Requests;

use App\Helpers\CryptoHelper;
use App\Models\Ms_package;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Pastikan user terautentikasi dan memiliki profil employee
        return Auth::check() && !is_null(Auth::user()->employee);
    }

    protected function prepareForValidation()
    {
        $routeId = $this->route('id') ?? $this->route('package');

        // 1. Dekripsi semua ID agar Backend bisa mengolah integer ID asli
        $this->merge([
            'id'          => $routeId ? CryptoHelper::decrypt($routeId) : null,
            'service_id'  => $this->service_id ? CryptoHelper::decrypt($this->service_id) : null,
            'category_id' => $this->category_id ? CryptoHelper::decrypt($this->category_id) : null,
            'unit_id'     => $this->unit_id ? CryptoHelper::decrypt($this->unit_id) : null,
        ]);
    }

    public function rules(): array
    {
        $user = Auth::user();
        $tenantId = $user->employee->tenant_id;
        $packageId = $this->id;

        // 2. Proteksi Kepemilikan Data (Edit Mode)
        if ($packageId) {
            $exists = Ms_package::where('id', $packageId)
                                ->where('tenant_id', $tenantId)
                                ->exists();
            if (!$exists) {
                abort(403, 'Anda tidak memiliki otoritas atas data ini.');
            }
        }

        return [
            'id'            => 'nullable|integer',
            'service_id'    => [
                'required', 'integer',
                Rule::exists('Ms_services', 'id')
            ],
            'category_id'   => [
                'required', 'integer',
                // Kategori harus milik tenant yang sedang login
                Rule::exists('Ms_categories', 'id')->where('tenant_id', $tenantId)
            ],
            'unit_id'       => [
                'required', 'integer',
                // Unit boleh Global (null) atau spesifik milik Tenant
                Rule::exists('Ms_units', 'id')->where(function ($q) use ($tenantId) {
                    $q->where('tenant_id', $tenantId)->orWhereNull('tenant_id');
                })
            ],
            
           'name' => [
            'required', 
            'string', 
            'max:100',
                // 1. Hanya izinkan Huruf, Angka, Spasi, dan simbol standar ( - & ( ) . )
                'regex:/^[a-zA-Z0-9\s\-&().]+$/',
                // 2. Proteksi tambahan agar tidak mengandung "http", "www", atau ".com" dsb.
                function ($attribute, $value, $fail) {
                    if (preg_match('/(http|https|www|\.com|\.net|\.id|\.io)/i', $value)) {
                        $fail('Nama paket tidak diperbolehkan mengandung link atau URL.');
                    }
                },
            ],
            'description'   => 'nullable|string|max:200',
            'price'         => 'required|numeric|min:0',
            'discount_type' => 'required|in:fixed,percentage,none',
            'discount_value'=> [
                'nullable', 'numeric', 'min:0',
                function ($attribute, $value, $fail) {
                    if ($this->discount_type === 'percentage' && $value > 100) {
                        $fail('Diskon persentase tidak boleh lebih dari 100%.');
                    }
                }
            ],
            // 3. RE-CALCULATE VALIDATION: Memastikan final_price jujur sesuai diskon
            'final_price'   => [
                'required', 'numeric', 'min:0',
                function ($attribute, $value, $fail) {
                    $price = (float) $this->price;
                    $discValue = (float) ($this->discount_value ?? 0);
                    $expectedFinal = $price;

                    if ($this->discount_type === 'percentage') {
                        $expectedFinal = $price - ($price * $discValue / 100);
                    } elseif ($this->discount_type === 'fixed') {
                        $expectedFinal = $price - $discValue;
                    }

                    // Cek selisih (toleransi pembulatan 1 rupiah)
                    if (abs($value - $expectedFinal) > 1) {
                        $fail("Kalkulasi harga akhir tidak valid (Input: $value, Hitungan: $expectedFinal).");
                    }
                }
            ],
            'duration_menit' => 'required|integer|min:0',
            'is_weight_based'=> 'required|boolean', 
            'min_order'      => 'required|numeric|min:0.1',
            'is_active'      => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'final_price.required' => 'Harga akhir wajib diisi.',
            'code.unique'          => 'Kode paket ini sudah terdaftar di bisnis Anda.',
            'category_id.exists'   => 'Kategori yang dipilih tidak valid untuk bisnis Anda.',
            'unit_id.exists'       => 'Satuan tidak ditemukan.',
            'name.not_regex'       => 'Nama mengandung karakter simbol yang dilarang.',
        ];
    }
}