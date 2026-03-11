<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper; // Pastikan helper ini sudah Mas buat

class TransactionPaymentMethodResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Performa: Hanya memproses data yang sudah di-select di Repository.
     */
    public function toArray($request): array
    {
        return [
            // WAJIB: Enkripsi ID agar aman dan konsisten dengan logic FE Mas
            'id'   => CryptoHelper::encrypt($this->id),
            
            'name' => $this->name,
            'code' => $this->code, // Digunakan FE untuk logic: selectedPaymentMethod?.code === 'CASH'
            'type' => $this->type, // CASH, TRANSFER, E-WALLET, dll
            
            // Cast ke boolean agar di JS (React) tipenya true/false, bukan 1/0
            'is_default' => (bool) $this->is_default,
        ];
    }
}