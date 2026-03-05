<?php

namespace App\Repositories;

use App\Models\LogDbError;

class LogDbErrorRepository
{
    public function store(array $data)
    {
        
        return LogDbError::create($data);
    }
}