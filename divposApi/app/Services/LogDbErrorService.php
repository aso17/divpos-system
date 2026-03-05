<?php

namespace App\Services;

use App\Repositories\LogDbErrorRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Database\QueryException;

class LogDbErrorService
{
    protected $repo;

    public function __construct(LogDbErrorRepository $repo)
    {
        $this->repo = $repo;
    }

    public function log(\Throwable $e)
    {
        $user = Auth::user();
        
        $data = [
            'user_id'    => $user?->id,
            'tenant_id'  => $user?->employee?->tenant_id,
            'error_code' => $this->getErrorCode($e),
            'message'    => $e->getMessage(),
            'url'        => Request::fullUrl(),
            'ip_address' => Request::ip(),
            'sql_query'  => ($e instanceof QueryException) ? $e->getSql() : null,
            'bindings'   => ($e instanceof QueryException) ? $e->getBindings() : [],
        ];

        try {
            return $this->repo->store($data);
        } catch (\Exception $fallback) {
            // \Log::emergency("CRITICAL: LogDbError table is failing! " . $fallback->getMessage());
        }
    }

    private function getErrorCode($e)
    {
        return method_exists($e, 'getStatusCode') ? $e->getStatusCode() : $e->getCode();
    }
}