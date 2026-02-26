<?php

namespace App\Http\Resources;

use App\Helpers\CryptoHelper;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
       return [
        // Enkripsi ID agar aman di sisi Client (React)
        'id'         => CryptoHelper::encrypt($this->id),
        'tenant_id'  => CryptoHelper::encrypt($this->tenant_id),
        
        // Data Utama
        'name'       => $this->name,
        'phone'      => $this->phone,
        'address'    => $this->address ?? '',
        
        // Meta Data - PERBAIKAN DI SINI
        'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
        'updated_at' => $this->updated_at ? $this->updated_at->format('Y-m-d H:i:s') : null,
    ];
    }
}