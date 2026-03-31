<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class AuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // 🚩 is_owner murni mengecek kolom tenant_id di tabel Ms_users (alias: user_tenant_id)
        $isOwner = $this->user_tenant_id ? true : false;

        return [
            'id'        => $this->id ? CryptoHelper::encrypt($this->id) : null,
            'email'     => $this->email,
            'username'  => $this->username,
            'full_name' => $this->full_name ?? 'User',
            'is_owner'  => $isOwner,

            'role' => [
                'name' => $this->role_name, // Mengambil alias dari query join repository
                'code' => $this->role_code, // Mengambil alias dari query join repository
            ],

            'avatar' => $this->avatar
                ? asset('storage/' . $this->avatar)
                : asset('assets/images/default-avatar.png'),

            // 🎯 Data Tenant: Sekarang aman untuk Owner maupun Staff

            'tenant' => $this->tenant_id ? [
                    'id'            => CryptoHelper::encrypt($this->tenant_id),
                    'name'          => $this->tenant_name,
                    'slug'          => $this->tenant_slug,
                    'code'          => $this->tenant_code,
                    'business_type' => $this->business_type_code,
                    'logo'          => $this->tenant_logo
                                        ? asset('storage/' . ltrim($this->tenant_logo, '/'))
                                        : asset('assets/images/default-tenant-logo.png'),
                ] : null,

          // Data Outlet
            'outlet' => $this->when(true, function () { // Kita buat true agar selalu muncul
                // Ambil ID (Owner biasanya null, Staff ada isinya)
                $oid = $this->employee_outlet_id ?? ($this->outlet_id ?? null);

                return [
                    // Jika $oid null (Owner), ID-nya null. Jika ada (Staff), di-encrypt.
                    'id'   => $oid ? CryptoHelper::encrypt($oid) : null,

                    // Jika $oid null (Owner), namanya jadi "Akses Semua Outlet"
                    'name' => $oid ? ($this->outlet_name ?? 'Pusat') : 'Semua Outlet (Global)',

                    // Tambahkan flag ini agar Frontend React Mas gampang ngeceknya
                    'is_all_access' => $oid ? false : true,
                ];
            }),
        ];
    }
}
