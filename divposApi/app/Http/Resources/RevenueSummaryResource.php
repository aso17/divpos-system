<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RevenueSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Pastikan Resource ini menerima array dari Repository yang sudah di-flatten
        return [
            // Metrik Utama (Untuk Card di Frontend)
            'total_transactions'  => (int)   ($this['total_transactions'] ?? 0),
            'total_grand_total'   => (float) ($this['total_grand_total'] ?? 0),
            'total_paid'          => (float) ($this['total_paid'] ?? 0),
            'total_outstanding'   => (float) ($this['total_outstanding'] ?? 0),
            'total_discount'      => (float) ($this['total_discount'] ?? 0),
            'total_tax'           => (float) ($this['total_tax'] ?? 0),
            'avg_per_transaction' => (float) ($this['avg_per_transaction'] ?? 0),

            // Statistik Status (Jika ingin ditampilkan di chart/badge)
            'count_paid'          => (int)   ($this['count_paid'] ?? 0),
            'count_partial'       => (int)   ($this['count_partial'] ?? 0),
            'count_unpaid'        => (int)   ($this['count_unpaid'] ?? 0),

            // List Breakdown (Data untuk tabel kecil atau chart pie)
            'by_payment_method'   => $this['by_payment_method'] ?? [],
            'by_outlet'           => $this['by_outlet'] ?? [],
        ];
    }
}
