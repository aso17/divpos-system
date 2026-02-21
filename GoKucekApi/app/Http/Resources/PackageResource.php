<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PackageResource extends JsonResource
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
            'id'            => $this->id,
            'service_id'    => $this->service_id,
            'category_id'   => $this->category_id,
            'code'          => $this->code,
            'name'          => $this->name,
            'description'   => $this->description,
            'price'         => (float) $this->price, // Pastikan dikirim sebagai angka
            'unit'          => $this->unit,
            'min_order'     => (float) $this->min_order,
            'is_active'     => (bool) $this->is_active,
            'created_at'    => optional($this->created_at)->format('Y-m-d H:i:s'),

            // Memasukkan detail Layanan
            'service' => [
                'id'    => $this->service_id,
                'name'  => optional($this->service)->name,
                'code'  => optional($this->service)->code,
            ],

            // Memasukkan detail Kategori
            'category' => [
                'id'    => $this->category_id,
                'name'  => optional($this->category)->name,
                'slug'  => optional($this->category)->slug,
            ],

            // Opsional: Jika Anda ingin menyertakan info Tenant
            'tenant' => [
                'tenant_id' => $this->tenant_id,
                'name'      => optional($this->tenant)->name,
            ],
        ];
    }
}