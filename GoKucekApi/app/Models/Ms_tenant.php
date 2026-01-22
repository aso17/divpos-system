<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ms_tenant extends Model
{
    use SoftDeletes;

    protected $table = 'Ms_tenants';
    protected $fillable = [
        'name',
        'slug',
        'code',
        'domain',
        'logo_path',
        'primary_color',
        'theme',
        'is_active',
        'created_by',
        'updated_by',
    ];


    /* =======================
     |  Relationships
     ======================= */

    public function createdBy()
    {
        return $this->belongsTo(Ms_user::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(Ms_user::class, 'updated_by');
    }
}
