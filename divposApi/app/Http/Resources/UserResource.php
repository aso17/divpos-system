<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        // Enkripsi ID agar aman dari scraping
        $encryptedId = CryptoHelper::encrypt($this->id);

        return [
            // ID yang sudah dienkripsi
            'id'         => $encryptedId, 
            'full_name'  => $this->full_name,
            'email'      => $this->email,
            'username'   => $this->username,
            'phone'      => $this->phone,
            'avatar'     => $this->avatar,
            
            'is_active'  => (bool) ($this->employee_status ?? $this->is_active),
            
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,

            // Data Role (Sudah tersedia langsung dari Join)
            'role' => [
                'role_id'   => $this->role_id,
                'role_name' => $this->role_name, // Langsung dari kolom hasil join
                'code'      => $this->role_code, // Alias dari query join kita tadi
            ],

            // Data Tenant (Jika di query utama Mas sudah select tenant_id)
            'tenant' => [
                'tenant_id' => $this->tenant_id,
                // Jika butuh slug/code tenant, pastikan sudah di-join di repository
                'slug'      => $this->tenant_slug ?? null, 
                'code'      => $this->tenant_code ?? null,
            ],
            
            // Tambahan metadata untuk mempermudah Frontend React Mas
            'meta' => [
                'is_owner' => $this->role_code === 'OWNER',
                'is_staff' => in_array($this->role_code, ['ADMIN', 'KASIR']),
            ]
        ];
    }
}