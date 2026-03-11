<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class PaymentMethodResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            // WAJIB: Enkripsi ID agar aman saat sampai di React
            'id' => CryptoHelper::encrypt($this->id),
            
            'name' => $this->name,
            'code' => $this->code, // Sangat penting untuk logic isCash di FE
            'type' => $this->type, // CASH, TRANSFER, E-WALLET
            
            // Karena kita pakai strategi Global, kolom ini bisa nullable
            'description' => $this->description ?? '-',
            
            // Untuk menentukan tombol mana yang aktif otomatis di kasir
            'is_default' => (bool)$this->is_default,
        ];
    }
}