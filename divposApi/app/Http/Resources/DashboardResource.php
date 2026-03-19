<?php

namespace App\Http\Resources;

use App\Services\DashboardService;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * DashboardResource
 *
 * Tanggung jawab: FORMAT RESPONSE ONLY.
 * - Mengubah array mentah dari Service menjadi JSON siap pakai React.
 * - Tidak ada query, tidak ada kalkulasi berat.
 * - Setiap nilai sudah dalam format yang langsung bisa dirender (value_fmt, delta_fmt).
 */
class DashboardResource extends JsonResource
{
    private DashboardService $service;

    public function __construct(mixed $resource, DashboardService $service)
    {
        parent::__construct($resource);
        $this->service = $service;
    }

    public function toArray($request): array
    {
        $d = $this->resource;

        return [
            'period'       => $d['period'],
            'generated_at' => now()->setTimezone('Asia/Jakarta')->toIso8601String(),

            // ── 1. Stat Cards ─────────────────────────────────────────────────
            'stats' => $this->buildStats($d),

            // ── 2. KPI Strip ──────────────────────────────────────────────────
            'kpi_strip' => $this->buildKpiStrip($d),

            // ── 3. Weekly Sales chart ─────────────────────────────────────────
            'weekly_sales' => [
                'labels'  => collect($d['weeklySales'])->pluck('label')->values()->all(),
                'revenue' => collect($d['weeklySales'])->pluck('revenue')->values()->all(),
                'count'   => collect($d['weeklySales'])->pluck('count')->values()->all(),
                'raw'     => $d['weeklySales'],
            ],

            // ── 4. Recent Transactions ────────────────────────────────────────
            'recent_transactions' => collect($d['recentTransactions'])
                ->map(fn ($tx) => [
                    'invoice'        => $tx->invoice_no,
                    'customer'       => $tx->customer_name ?? '-',
                    'total'          => (float) $tx->grand_total,
                    'total_fmt'      => $this->fmtRp((float) $tx->grand_total),
                    'status'         => $tx->status,
                    'payment_status' => $tx->payment_status,
                    'time'           => \Carbon\Carbon::parse($tx->order_date)
                                            ->timezone('Asia/Jakarta')
                                            ->format('H:i'),
                ])
                ->values()
                ->all(),

            // ── 5. Status Distribution ────────────────────────────────────────
            'status_distribution' => collect($d['statusDistribution'])
                ->map(fn ($r) => [
                    'status' => $r->status,
                    'total'  => (int) $r->total,
                ])
                ->values()
                ->all(),

            // ── 6. Top Packages ───────────────────────────────────────────────
            'top_packages' => collect($d['topPackages'])
                ->map(fn ($p) => [
                    'name'         => $p->package_name,
                    'total_qty'    => (float) $p->total_qty,
                    'total_revenue'=> (float) $p->total_revenue,
                    'revenue_fmt'  => $this->fmtRp((float) $p->total_revenue),
                    'tx_count'     => (int) $p->tx_count,
                ])
                ->values()
                ->all(),

            // ── 7. Payment Mix ────────────────────────────────────────────────
            'payment_mix' => collect($d['paymentMix'])
                ->map(fn ($p) => [
                    'method'    => $p->payment_method_name,
                    'count'     => (int) $p->pay_count,
                    'total'     => (float) $p->total,
                    'total_fmt' => $this->fmtRp((float) $p->total),
                ])
                ->values()
                ->all(),
        ];
    }

    // ─── Private builders ─────────────────────────────────────────────────────

    private function buildStats(array $d): array
    {
        $txDelta      = $this->service->transactionDelta($d['totalTransactions'], $d['prevTransactions']);
        $revGrowthPct = $this->service->revenueGrowthPct($d['revenue'], $d['prevRevenue']);

        return [
            [
                'key'       => 'customers',
                'label'     => 'Pelanggan',
                'value'     => $d['totalCustomers'],
                'value_fmt' => number_format($d['totalCustomers']),
                'delta_fmt' => '+' . $d['newCustomers'] . ' baru',
                'delta_up'  => true,
                'icon'      => 'users',
                'accent'    => 'blue',
            ],
            [
                'key'       => 'transactions',
                'label'     => 'Transaksi',
                'value'     => $d['totalTransactions'],
                'value_fmt' => number_format($d['totalTransactions']),
                'delta_fmt' => ($txDelta >= 0 ? '+' : '') . $txDelta,
                'delta_up'  => $txDelta >= 0,
                'icon'      => 'receipt',
                'accent'    => 'purple',
            ],
            [
                'key'       => 'revenue',
                'label'     => 'Revenue',
                'value'     => $d['revenue'],
                'value_fmt' => $this->fmtRp($d['revenue']),
                'delta_fmt' => $revGrowthPct !== null
                                   ? ($revGrowthPct >= 0 ? '+' : '') . $revGrowthPct . '%'
                                   : null,
                'delta_up'  => $d['revenue'] >= $d['prevRevenue'],
                'icon'      => 'wallet',
                'accent'    => 'emerald',
            ],
            [
                'key'       => 'pending',
                'label'     => 'Pending Orders',
                'value'     => $d['pendingOrders'],
                'value_fmt' => (string) $d['pendingOrders'],
                'delta_fmt' => null,
                'delta_up'  => false,
                'icon'      => 'shopping-cart',
                'accent'    => 'orange',
            ],
        ];
    }

    private function buildKpiStrip(array $d): array
    {
        return [
            ['key' => 'active_queue',    'label' => 'Antrian Aktif',    'value' => $d['activeQueue'],    'unit' => 'order',   'color' => 'blue'],
            ['key' => 'waiting_pickup',  'label' => 'Menunggu Pickup',  'value' => $d['waitingPickup'],  'unit' => 'item',    'color' => 'amber'],
            ['key' => 'unpaid_invoices', 'label' => 'Belum Lunas',      'value' => $d['unpaidInvoices'], 'unit' => 'invoice', 'color' => 'red'],
            ['key' => 'rating',          'label' => 'Rating Hari Ini',  'value' => 4.8,                  'unit' => '/ 5.0',   'color' => 'emerald'],
        ];
    }

    // ─── Format helpers ───────────────────────────────────────────────────────

    private function fmtRp(float $n): string
    {
        if ($n >= 1_000_000_000) return 'Rp ' . number_format($n / 1_000_000_000, 1) . 'M';
        if ($n >= 1_000_000)     return 'Rp ' . number_format($n / 1_000_000, 1) . 'jt';
        if ($n >= 1_000)         return 'Rp ' . number_format($n / 1_000, 0) . 'rb';
        return 'Rp ' . number_format($n, 0, ',', '.');
    }
}