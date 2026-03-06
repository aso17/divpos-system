<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Helpers\CryptoHelper;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class OutletRequest extends FormRequest
{
    protected $tenantId;

    public function authorize(): bool
    {
        // Ambil tenant_id langsung dari session/token login
        $this->tenantId = Auth::user()?->tenant_id;
        
        // Hanya izinkan jika user punya tenant_id
        return !is_null($this->tenantId);
    }

    protected function prepareForValidation()
    {
        $routeId = $this->route('id') ?? $this->route('outlet');
        $sanitizedData = [];
        
        // 1. Dekripsi ID Outlet (untuk update)
        if ($routeId) {
            $sanitizedData['id'] = CryptoHelper::decrypt($routeId);
        }

        // 2. 🛡️ PAKSA tenant_id dari Auth (Abaikan kiriman Frontend)
        $sanitizedData['tenant_id'] = $this->tenantId;

        // 3. Sanitasi Input Text (XSS Prevention)
        $fields = ['name', 'city', 'address', 'description'];
        foreach ($fields as $field) {
            if ($this->has($field)) {
                $value = trim($this->$field);
                $sanitizedData[$field] = htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8');
            }
        }

        $this->merge($sanitizedData);
    }

    public function rules(): array
    {
        return [
          
            'id' => [
                'nullable',
                'integer',
                $this->id ? Rule::exists('Ms_outlets', 'id')->where('tenant_id', $this->tenantId) : '',
            ],
            
         
            'name' => [
                'required', 'string', 'min:3', 'max:100',
                'regex:/^[a-zA-Z0-9\s\.\,\-\'\(\)]+$/', 
            ],

            'phone' => 'required|numeric|digits_between:10,15',
            'city' => ['required', 'string', 'max:50', 'regex:/^[a-zA-Z\s\.\-]+$/'],
            
            'address' => [
                'required', 'string', 'min:10',
                'not_regex:/<script|javascript|http|https|www|<\/|{[ ]*$/i',
            ],

            'description' => [
                'nullable', 'string', 'max:255',
                'not_regex:/<script|javascript|http|https|www|<\/|{[ ]*$/i',
            ],

            'is_active'      => 'boolean',
            'is_main_branch' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'id.exists' => 'Access denied: Data not found or ownership mismatch.',
            'name.regex' => 'Name contains illegal characters.',
            'address.not_regex' => 'Links or scripts are not allowed in the address.',
            'phone.numeric' => 'Phone number must be numeric.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            // 'data'=>$this->tenantId,
            'message' => 'Integrity Check Failed test',
            'errors'  => $validator->errors()
        ], 422));
    }
}