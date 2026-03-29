<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class TransactionEmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // ID dienkripsi untuk keamanan di frontend
            'id'            => CryptoHelper::encrypt($this->id),
            'employee_code' => $this->employee_code ?? '-',
            'full_name'     => $this->full_name,
            // Opsional: tambahkan job_title jika ingin ditampilkan di hasil pencarian
            'job_title'     => $this->job_title ?? '-',
        ];
    }
}
