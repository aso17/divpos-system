<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantConfig extends Model
{
    protected $fillable = ['tenant_id', 'key', 'value'];

    public function tenant()
    {
        return $this->belongsTo(Ms_tenant::class);
    }
}