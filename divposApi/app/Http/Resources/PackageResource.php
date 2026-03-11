<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class PackageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
       
        
        return [
            // ID di-CryptoHelper::encrypt untuk keamanan di URL/Frontend
            'id'             => CryptoHelper::encrypt($this->id),
            'service_id'     => CryptoHelper::encrypt($this->service_id),
            'category_id'    => CryptoHelper::encrypt($this->category_id),
            'unit_id'        => $this->unit_id ? CryptoHelper::encrypt($this->unit_id) : null,
            
            'code'           => $this->code,
            'name'           => $this->name,
            'description'    => $this->description,
            
            // Casting angka agar tetap presisi di React
            'price'          => (float) $this->price,
            'discount_type'  => $this->discount_type ?? 'none',
            'discount_value' => (float) ($this->discount_value ?? 0),
            'final_price'    => (float) ($this->final_price ?? $this->price),
            
            'duration_menit' => (int) ($this->duration_menit ?? 0),
            'is_weight_based'=> (bool) ($this->is_weight_based ?? false),
            'min_order'      => (float) ($this->min_order ?? 1),
            'is_active'      => (bool) $this->is_active,
            
            'created_at'     => $this->created_at instanceof \DateTime 
                                ? $this->created_at->format('Y-m-d H:i:s') 
                                : ($this->created_at ?? null),

            // Detail Layanan (Handle Eloquent Relation atau Query Join)
            'service' => [
                'id'   => $this->service_id ? CryptoHelper::encrypt($this->service_id) : null,
                'name' => $this->service_name ?? optional($this->service)->name,
                'code' => $this->service_code ?? optional($this->service)->code,
            ],

            // Detail Kategori
            'category' => [
                'id'   => $this->category_id ? CryptoHelper::encrypt($this->category_id) : null,
                'name' => $this->category_name ?? optional($this->category)->name,
                'slug' => $this->category_slug ?? optional($this->category)->slug,
            ],

            // Detail Unit (Sesuai skema relasional baru kita)
            'unit' => [
                'id'         => $this->unit_id ? CryptoHelper::encrypt($this->unit_id) : null,
                'name'       => $this->unit_name ?? optional($this->unit)->name,
                'short_name' => $this->unit_short_name ?? optional($this->unit)->short_name,
                'is_decimal' => (bool) ($this->unit_is_decimal ?? optional($this->unit)->is_decimal),
            ],
        ];
    }
}