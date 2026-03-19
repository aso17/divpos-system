<?php

namespace App\Services;

use App\Repositories\DashboardRepository;
use Carbon\Carbon;

/**
 * DashboardService
 *
 * Tanggung jawab: BUSINESS LOGIC ONLY.
 * - Hitung delta (selisih periode sekarang vs periode sebelumnya).
 * - Bangun array 7 hari penuh meski tidak ada transaksi.
 * - Tidak ada query SQL di sini — semua lewat DashboardRepository.
 */
class DashboardService
{
    public function __construct(
        private readonly DashboardRepository $repo
    ) {}

    // ─── Period helper ────────────────────────────────────────────────────────

    /**
     * Kembalikan [$start, $end] Carbon berdasarkan string period.
     */
    public function periodRange(string $period): array
    {
        // Timezone sudah di-set di config/app.php → tidak perlu inject manual
        return match ($period) {
            'Hari Ini'   => [Carbon::today()->startOfDay(),                         Carbon::now()],
            'Minggu Ini' => [Carbon::now()->startOfWeek(Carbon::MONDAY),            Carbon::now()],
            'Bulan Ini'  => [Carbon::now()->startOfMonth(),                         Carbon::now()],
            default      => [Carbon::now()->startOfWeek(Carbon::MONDAY),            Carbon::now()],
        };
    }

    /**
     * Kembalikan [$prevStart, $prevEnd] — period yang tepat sebelum period aktif.
     * Dipakai untuk menghitung delta %.
     */
    private function previousRange(Carbon $start, Carbon $end): array
    {
        $duration  = $end->diffInSeconds($start);
        $prevEnd   = $start->copy()->subSecond();
        $prevStart = $prevEnd->copy()->subSeconds((int) $duration);

        return [$prevStart, $prevEnd];
    }

    // ─── Aggregat utama ───────────────────────────────────────────────────────

    /**
     * Kumpulkan SEMUA data yang dibutuhkan dashboard dalam satu panggilan.
     * Controller cukup panggil method ini satu kali.
     */
    public function buildDashboard(int $tenantId, string $period): array
    {
        [$start, $end] = $this->periodRange($period);
        [$prevStart, $prevEnd] = $this->previousRange($start, $end);

        $today = Carbon::today();

        // ── Stat cards ────────────────────────────────────────────────────────
        $totalCustomers    = $this->repo->countCustomers($tenantId);
        $newCustomers      = $this->repo->countNewCustomers($tenantId, $start, $end);
        $totalTransactions = $this->repo->countTransactions($tenantId, $start, $end);
        $prevTransactions  = $this->repo->countTransactions($tenantId, $prevStart, $prevEnd);
        $revenue           = $this->repo->sumRevenue($tenantId, $start, $end);
        $prevRevenue       = $this->repo->sumRevenue($tenantId, $prevStart, $prevEnd);
        $pendingOrders     = $this->repo->countPendingOrders($tenantId, $start, $end);

        // ── KPI strip ─────────────────────────────────────────────────────────
        $activeQueue    = $this->repo->countActiveQueue($tenantId, $today);
        $waitingPickup  = $this->repo->countWaitingPickup($tenantId);
        $unpaidInvoices = $this->repo->countUnpaidInvoices($tenantId);

        // ── Charts & lists ────────────────────────────────────────────────────
        $sevenDaysStart = Carbon::now()->subDays(6)->startOfDay();
        $sevenDaysEnd   = Carbon::now()->endOfDay();

        $weeklySales         = $this->buildWeeklySales($tenantId, $sevenDaysStart, $sevenDaysEnd);
        $recentTransactions  = $this->repo->recentTransactions($tenantId, 5);
        $statusDistribution  = $this->repo->statusDistribution($tenantId, $start, $end);
        $topPackages         = $this->repo->topPackages($tenantId, $start, $end, 5);
        $paymentMix          = $this->repo->paymentMix($tenantId, $start, $end);

        return compact(
            'period',
            // stat cards
            'totalCustomers', 'newCustomers',
            'totalTransactions', 'prevTransactions',
            'revenue', 'prevRevenue',
            'pendingOrders',
            // kpi strip
            'activeQueue', 'waitingPickup', 'unpaidInvoices',
            // charts
            'weeklySales', 'recentTransactions',
            'statusDistribution', 'topPackages', 'paymentMix',
        );
    }

    // ─── Weekly sales builder ─────────────────────────────────────────────────

    /**
     * Pastikan array 7 hari selalu penuh meski tidak ada transaksi di hari tertentu.
     * Repository hanya mengembalikan hari yang ada datanya (sparse).
     * Method ini fill gap dengan revenue=0, count=0.
     */
    private function buildWeeklySales(int $tenantId, Carbon $start, Carbon $end): array
    {
        $rows = collect(
            $this->repo->weeklySalesRaw($tenantId, $start, $end)
        )->keyBy('day');   // key: '2025-03-12'

        return collect(range(0, 6))
            ->map(function (int $i) use ($start, $rows) {
                $date = $start->copy()->addDays($i);
                $key  = $date->format('Y-m-d');
                $row  = $rows->get($key);

                return [
                    'label'   => $date->locale('id')->isoFormat('ddd'),  // Sen, Sel, …
                    'date'    => $key,
                    'revenue' => $row ? (float) $row->revenue   : 0.0,
                    'count'   => $row ? (int)   $row->tx_count  : 0,
                ];
            })
            ->values()
            ->all();
    }

    // ─── Delta helpers (dipakai DashboardResource) ───────────────────────────

    public function revenueGrowthPct(float $current, float $prev): ?float
    {
        if ($prev == 0.0) {
            return $current > 0 ? 100.0 : null;
        }
        return round((($current - $prev) / $prev) * 100, 1);
    }

    public function transactionDelta(int $current, int $prev): int
    {
        return $current - $prev;
    }
}