<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Resources\PaymentRecapResource;
use App\Repositories\PaymentRecapRepository;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentRecapService
{
    public function __construct(
        private readonly PaymentRecapRepository $repository
    ) {
    }

    /**
     * Mengembalikan data paginated + summary sebagai array siap JSON.
     */
    public function getPaginated(array $filters): array
    {
        $perPage = (int) ($filters['per_page'] ?? 10);
        $page    = (int) ($filters['page']     ?? 1);

        // Jalankan dua query: paginate + summary (parallel-friendly)
        $paginated = $this->repository->paginate($filters, $perPage, $page);
        $summary   = $this->repository->getSummary($filters);

        return [
            'data'    => PaymentRecapResource::collection($paginated)->resolve(),
            'meta'    => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'from'         => $paginated->firstItem(),
                'to'           => $paginated->lastItem(),
            ],
            'summary' => $summary,
        ];
    }

    /**
     * Export ke Excel menggunakan Streamed Response + fputcsv (tanpa package tambahan).
     * Ganti implementasi ini dengan Laravel Excel (maatwebsite) jika dibutuhkan format xlsx.
     */
    public function export(array $filters): StreamedResponse
    {
        $rows = $this->repository->getAll($filters);

        $filename = 'rekap-pembayaran-' . ($filters['date_from'] ?? '') . '-' . ($filters['date_to'] ?? '') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            // BOM untuk Excel UTF-8
            fputs($handle, "\xEF\xBB\xBF");

            // Header kolom
            fputcsv($handle, [
                'No',
                'No Invoice',
                'Tanggal Order',
                'Nama Pelanggan',
                'Telepon',
                'Outlet',
                'Total Tagihan',
                'Total Terbayar',
                'Sisa',
                'Metode Pembayaran',
                'Status Pembayaran',
            ], ';');

            // Rows
            foreach ($rows as $index => $row) {
                fputcsv($handle, [
                    $index + 1,
                    $row->invoice_no,
                    $row->order_date,
                    $row->customer_name ?? 'Umum',
                    $row->customer_phone ?? '-',
                    $row->outlet_name ?? '-',
                    number_format($row->grand_total, 2, ',', '.'),
                    number_format($row->total_paid, 2, ',', '.'),
                    number_format(max(0, $row->grand_total - $row->total_paid), 2, ',', '.'),
                    $row->payment_method_name ?? '-',
                    $row->payment_status,
                ], ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
