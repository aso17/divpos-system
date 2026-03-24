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
        // 1. Ambil data asli dari database
        $data = $this->model->select('id', 'name')
                    ->where('is_active', true) // Pastikan hanya yang aktif
                    ->orderBy('name', 'asc')
                    ->get();

        // 2. Transformasi data: Enkripsi ID sebelum dikirim ke FE
        return $data->map(function ($type) {
            return [
                'id'   => CryptoHelper::encrypt($type->id), // Enkripsi di sini
                'name' => $type->name,
            ];
        });
    }
    public function findById($id)
    {
        return $this->model->find($id);
    }
}
