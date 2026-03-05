<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class OutletResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            
            'id'             => CryptoHelper::encrypt($this->id),
            'tenant_id'      => CryptoHelper::encrypt($this->tenant_id),
            // Data Identitas Utama
            'name'           => $this->name,
            'code'           => $this->code,
            'phone'          => $this->phone,
            'city'           => $this->city,
            
            // Configuration & Status
            'is_active'      => (bool) $this->is_active,
            'is_main_branch' => (bool) $this->is_main_branch,

            // --- OPTIMASI QUERY SENSITIVE ---
            // Gunakan when() agar tidak error jika kolom tidak di-select di query List
            'address'        => $this->when(isset($this->address), $this->address),
            'description'    =>$this->description,
           
            // Timestamps: Format ISO 8601 lebih standar untuk React/Frontend
            'created_at'     => $this->created_at?->toIso8601String(),
            
            // Tampilkan updated_at hanya jika kolomnya memang ditarik (biasanya di Detail View)
            'updated_at'     => $this->when(isset($this->updated_at), function() {
                return $this->updated_at?->toIso8601String();
            }),
        ];
    }
}