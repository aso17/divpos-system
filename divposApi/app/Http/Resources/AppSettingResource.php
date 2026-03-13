<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Karena di Service sudah di-cast, di sini kita tinggal lewatkan saja
        return [
            'key'   => $this['key'],
            'value' => $this['value'],
            'type'  => $this['type'],
        ];
    }
}