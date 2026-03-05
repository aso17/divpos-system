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
            /**
             * 🛡️ ID Utama
             * Prioritaskan employee_id. Jika null (belum punya profil karyawan), 
             * gunakan user_id agar frontend tetap punya key unik untuk list.
             */
            'id' => $this->employee_id 
                    ? CryptoHelper::encrypt($this->employee_id) 
                    : CryptoHelper::encrypt($this->user_id), 
            
            // 👤 Informasi Dasar (Gunakan fallback jika data employee null)
            'full_name'     => $this->full_name ?? 'User Administratif',
            'employee_code' => $this->employee_code ?? '-',
            'phone'         => $this->phone ?? '-',
            'job_title'     => $this->job_title ?? ($this->role_name ?? 'Staff'),
            'is_active'     => (bool) ($this->employee_active ?? true),
            
            // 📍 Data Outlet (Berdasarkan alias join Ms_outlets)
            'outlet' => [
                'id'   => $this->outlet_id ? CryptoHelper::encrypt($this->outlet_id) : null,
                'name' => $this->outlet_name ?? 'Pusat/Global', 
            ],
            
            // 🔐 Akun Login (Data pasti ada karena base query dari Ms_user)
            'has_login'   => true,
            'user_id'     => CryptoHelper::encrypt($this->user_id),
            'email'       => $this->user_email,
            
            // 🛡️ Data Role (Hasil Join Ms_roles)
            'role' => [
                'id'   => $this->user_role_id ? CryptoHelper::encrypt($this->user_role_id) : null,
                'name' => $this->role_name ?? 'No Role',
                'code' => $this->role_code ?? 'NONE',
            ],
            
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
        ];
    }
}