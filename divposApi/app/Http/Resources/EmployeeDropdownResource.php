<?php

namespace App\Http\Resources;

use App\Helpers\CryptoHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeDropdownResource extends JsonResource
{
   
    public function toArray(Request $request): array
    {
        return [
            // ID Utama yang akan dikirim balik ke UserRequest (Store)
            'id'            => CryptoHelper::encrypt($this->id), 
            
            // Informasi dasar untuk tampilan dropdown
            'full_name'     => $this->full_name,
            'job_title'     => $this->job_title,
            
            // Tambahan field jika dibutuhkan untuk auto-fill di form FE
            'phone'         => $this->phone,
            
            // Tenant ID didekripsi jika FE butuh melakukan pengecekan atau filter lanjutan
            'tenant_id'     => $this->tenant_id ? CryptoHelper::encrypt($this->tenant_id) : null,

        ];
    }
}