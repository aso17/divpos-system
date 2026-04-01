<?php

namespace App\Repositories;

use App\Models\Ms_business_type;
use App\Helpers\CryptoHelper;

class BusinessTypeRepository
{
    protected $model;

    public function __construct(Ms_business_type $businessType)
    {
        $this->model = $businessType;
    }

    public function getAll()
    {
        $data = $this->model->select('id', 'name')
                    ->where('is_active', true)
                    ->orderBy('name', 'asc')
                    ->get();

        return $data->map(function ($type) {
            return [
                'id'   => CryptoHelper::encrypt($type->id),
                'name' => $type->name,
            ];
        });
    }
    public function findById($id)
    {
        return $this->model->find($id);
    }
}
