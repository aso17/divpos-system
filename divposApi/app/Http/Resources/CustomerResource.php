<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

/**
 * CustomerResource
 * Dipakai untuk list maupun detail — kolom disesuaikan kebutuhan frontend.
 */
class CustomerResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
             'id'             => CryptoHelper::encrypt($this->id),
            'name'       => $this->name,
            'phone'      => $this->phone,
            'email'      => $this->email,
            'address'    => $this->address,
            'gender'     => $this->gender,
            'gender_label' => match($this->gender) {
                'L'     => 'Laki-laki',
                'P'     => 'Perempuan',
                default => '-',
            },
            'point'      => (float) $this->point,
            'is_active'  => (bool) $this->is_active,
            'created_at' => $this->created_at?->format('d M Y'),
        ];
    }
}
