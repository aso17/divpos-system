<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class CategoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // 🛡️ ENKRIPSI ID: Menggunakan CryptoHelper sesuai standar keamanan Mas
            'id'             => CryptoHelper::encrypt($this->id),
            
            'name'           => $this->name,
            'slug'           => $this->slug,
            
            // Menambahkan Priority (Penting untuk sorting di React POS)
            'priority'       => (int) $this->priority,
            
            // Memastikan tipe data Boolean (bukan 1 atau 0)
            'is_active'      => (bool) $this->is_active,
            
            // Format Audit Trail dengan Null Safe
            'created_at'     => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'     => $this->updated_at?->format('Y-m-d H:i:s'),
            
            /**
             * Eager Loading Audit (Hanya muncul jika di-load di Controller)
             * Gunakan 'creator' dan 'updater' sesuai relasi di Model
             */
            'creator_name'   => $this->whenLoaded('creator', fn() => $this->creator->name),
            'updater_name'   => $this->whenLoaded('updater', fn() => $this->updater->name),
        ];
    }
}