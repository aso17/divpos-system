<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ms_module extends Model
{
    protected $table = 'Ms_modules';

    protected $fillable = [
        'module_name',
        'code',
        'icon',
        'order_no',
        'is_active',
    ];
}
