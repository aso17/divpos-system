<?php

namespace App\Services;

use App\Exports\Report\RevenueReportExport;
use App\Http\Resources\RevenueReportResource;
use App\Http\Resources\RevenueSummaryResource;
use App\Repositories\RevenueReportRepository; // Langsung pakai Class
use Illuminate\Support\Facades\Cache;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RevenueReportService
{
    /**
     * Dependency Injection langsung ke Class Repository (Tanpa Interface).
     */
    public function __construct(
        private readonly RevenueReportRepository $repository
    ) {
    }

    /* -----------------------------------------------------------------------
     | GET REPORT (Summary + Transactions)
     | Menggabungkan data agregat dan data tabel paginasi.
     * --------------------------------------------------------------------- */
    public function getReportRevenue(int $tenantId, array $filters): array
    {
        // 1. Cache untuk Summary
        $cacheKey = $this->generateCacheKey($tenantId, $filters);
        $summaryData = Cache::remember($cacheKey, 300, function () use ($tenantId, $filters) {
            return $this->repository->getSummary($tenantId, $filters);
        });

        // 2. Ambil data Transaksi (Real-time)
        $transactions = $this->repository->getTransactions($tenantId, $filters);

        // 3. Ambil Master Data untuk Dropdown Filter (Lakukan ini di sini)
        // Asumsi: Mas punya Repo atau Model untuk ini
        $outlets = \App\Models\Ms_outlet::where('tenant_id', $tenantId)->select('id', 'name')->get();
        // $paymentMethods = \App\Models\Ms_PaymentMethod::where('tenant_id', $tenantId)->select('id', 'name')->get();

        return [
            'summary'         => new RevenueSummaryResource($summaryData),
            'transactions'    => RevenueReportResource::collection($transactions)->response()->getData(true),
            'outlets'         => $outlets,
            // 'payment_methods' => $paymentMethods,
        ];
    }

    /* -----------------------------------------------------------------------
     | EXPORT DATA (Excel / CSV)
     | Menggunakan Stream Download agar tidak memakan RAM server.
     * --------------------------------------------------------------------- */
    // public function export(int $tenantId, array $filters, string $format = 'xlsx'): mixed
    // {
    //     // Ambil data stream (cursor) dari repository
    //     $dataStream = $this->repository->getForExport($tenantId, $filters);

    //     // Ambil summary untuk diletakkan di bagian atas/bawah file Excel
    //     $summary = $this->repository->getSummary($tenantId, $filters);

    //     $export   = new RevenueReportExport($dataStream, $summary, $filters);
    //     $timestamp = now()->format('Ymd_His');
    //     $filename = "Laporan_Pendapatan_{$timestamp}.{$format}";

    //     $writerType = match (strtolower($format)) {
    //         'csv'  => \Maatwebsite\Excel\Excel::CSV,
    //         'pdf'  => \Maatwebsite\Excel\Excel::DOMPDF,
    //         default => \Maatwebsite\Excel\Excel::XLSX,
    //     };

    //     return Excel::download($export, $filename, $writerType);
    // }

    /* -----------------------------------------------------------------------
     | HELPER: Generate Unique Cache Key
     | md5(serialize) memastikan jika ada satu filter berubah, cache lama
     | tidak akan dipakai (menghindari data basi).
     * --------------------------------------------------------------------- */
    private function generateCacheKey(int $tenantId, array $filters): string
    {
        // Sort filter agar key tetap sama meskipun urutan parameter di URL acak
        ksort($filters);
        return "rev_summary_t{$tenantId}_" . md5(json_encode($filters));
    }
}
