<?php

    namespace App\Http\Resources;
    use Illuminate\Http\Resources\Json\JsonResource;

   class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'full_name'  => $this->full_name,
            'email'      => $this->email,
            'username'   => $this->username,
            'phone'      => $this->phone,
            'is_active'  => (bool) $this->is_active,
            'avatar'     => $this->avatar,
            'created_at' => optional($this->created_at)->format('Y-m-d H:i:s'),

            'role' => [
                'role_id'   => $this->role_id,
                'role_name' => optional($this->role)->role_name,
                'code' => optional($this->role)->code,
            ],

            'tenant' => [
                'tenant_id'   => $this->tenant_id,
                'slug' => optional($this->tenant)->slug,
                'code' => optional($this->tenant)->code,
            ],
        ];
    }
}
