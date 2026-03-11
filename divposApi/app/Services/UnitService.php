<?php

namespace App\Services;

use App\Repositories\UnitRepository;

class UnitService
{
    protected $unitRepo;

    public function __construct(UnitRepository $unitRepo)
    {
        $this->unitRepo = $unitRepo;
    }

    public function getUnitAll($tenantId)
    {
       
        return $this->unitRepo->getUnitByTenant($tenantId);
    }
}