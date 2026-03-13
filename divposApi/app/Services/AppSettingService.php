<?php

namespace App\Services;

use App\Repositories\AppSettingRepository;

class AppSettingService
{
    protected $repo;

    public function __construct(AppSettingRepository $repo)
    {
        $this->repo = $repo;
    }

    public function getSettingsForTenant($tenantId)
    {
        $settings = $this->repo->getByTenant($tenantId);

        return $settings->map(function ($item) {
            return [
                'key'   => $item->key,
                'value' => $this->castValue($item->value, $item->type),
                'type'  => $item->type
            ];
        });
    }

    /**
     * Helper untuk mengubah string DB ke tipe data asli
     */
    private function castValue($value, $type)
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'number'  => (float) $value,
            'json'    => json_decode($value, true),
            default   => $value,
        };
    }
}