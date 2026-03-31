<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RolePermissionResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'menu_id'     => $this->menu_id,
            'menu_name'   => $this->menu_name,
            'module_id'   => $this->module_id,
            'module_name' => $this->module_name,
            'module_icon' => $this->module_icon,

            // 🚩 TAMBAHKAN INI: Agar FE bisa mengatur indentasi dan deteksi folder
            'parent_id'   => $this->parent_id,
            'is_parent'   => (bool) ($this->is_parent ?? false),

            // Cast ke boolean murni untuk Postgres compatibility
            'can_view'    => (bool) $this->can_view,
            'can_create'  => (bool) $this->can_create,
            'can_update'  => (bool) $this->can_update,
            'can_delete'  => (bool) $this->can_delete,
            'can_export'  => (bool) $this->can_export,
        ];
    }
}
