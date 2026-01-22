<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ms_role extends Model
{
    protected $table = 'Ms_roles';

    protected $fillable = [
        'role_name',
        'code',
        'is_active',
    ];
}
