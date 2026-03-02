<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => CryptoHelper::encrypt($this->id), // Enkripsi ID
            'full_name' => $this->full_name,
            'employee_code' => $this->employee_code,
            'phone' => $this->phone,
            'job_title' => $this->job_title,
            'is_active' => (bool) $this->is_active,
            'outlet' => [
                'id' => $this->outlet_id ? CryptoHelper::encrypt($this->outlet_id) : null,
                'name' => $this->outlet->name ?? 'Pusat',
            ],
            // Contoh jika butuh data user terkait
            'has_login' => !empty($this->user_id),
            'email' => $this->user->email ?? null,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}