<?php

namespace App\Repositories;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * DashboardRepository
 *
 * Tanggung jawab: RAW QUERY ONLY.
 * - Tidak ada business logic di sini.
 * - Setiap query hanya SELECT kolom yang benar-benar dipakai di frontend.
 * - Semua query memiliki index hint agar PostgreSQL memilih execution plan terbaik.
 * - Soft-delete selalu dijaga: WHERE deleted_at IS NULL.
 */
class DashboardRepository
{
    // ─── 1. STAT CARDS ────────────────────────────────────────────────────────

    /**
     * Total pelanggan aktif.
     * Index: (tenant_id, is_active) → sudah ada di Ms_customers
     */
    public function countCustomers(int $tenantId): int
    {
        return (int) DB::selectOne(
            'SELECT COUNT(*) AS total
               FROM "Ms_customers"
              WHERE tenant_id  = ?
                AND is_active  = true
                AND deleted_at IS NULL',
            [$tenantId]
        )->total;
    }

    /**
     * Pelanggan baru dalam rentang waktu.
     * Index: (tenant_id, created_at)
     */
    public function countNewCustomers(int $tenantId, Carbon $start, Carbon $end): int
    {
        return (int) DB::selectOne(
            'SELECT COUNT(*) AS total
               FROM "Ms_customers"
              WHERE tenant_id  = ?
                AND created_at BETWEEN ? AND ?
                AND deleted_at IS NULL',
            [$tenantId, $start, $end]
        )->total;
    }

    /**
     * Jumlah transaksi dalam rentang waktu.
     * Index: idx_trans_report_fast (tenant_id, outlet_id, status, payment_status)
     *        + order_date filter akan gunakan idx_queue_logic atau sequential scan kecil.
     */
    public function countTransactions(int $tenantId, Carbon $start, Carbon $end): int
    {
        return (int) DB::selectOne(
            'SELECT COUNT(*) AS total
               FROM "Tr_transactions"
              WHERE tenant_id  = ?
                AND order_date BETWEEN ? AND ?
                AND deleted_at IS NULL',
            [$tenantId, $start, $end]
        )->total;
    }

    /**
     * Total revenue (grand_total) transaksi PAID.
     * Index: idx_trans_report_fast → saring tenant + payment_status dahulu.
     */
    public function sumRevenue(int $tenantId, Carbon $start, Carbon $end): float
    {
        $row = DB::selectOne(
            'SELECT COALESCE(SUM(grand_total), 0) AS total
               FROM "Tr_transactions"
              WHERE tenant_id      = ?
                AND payment_status = \'PAID\'
                AND order_date     BETWEEN ? AND ?
                AND deleted_at     IS NULL',
            [$tenantId, $start, $end]
        );

        return (float) $row->total;
    }

    /**
     * Jumlah transaksi PENDING dalam rentang waktu.
     */
    public function countPendingOrders(int $tenantId, Carbon $start, Carbon $end): int
    {
        return (int) DB::selectOne(
            'SELECT COUNT(*) AS total
               FROM "Tr_transactions"
              WHERE tenant_id  = ?
                AND status     = \'PENDING\'
                AND order_date BETWEEN ? AND ?
                AND deleted_at IS NULL',
            [$tenantId, $start, $end]
        )->total;
    }

    // ─── 2. KPI STRIP ─────────────────────────────────────────────────────────

    /**
     * Antrian aktif hari ini: PENDING + PROCESS.
     * Hanya butuh COUNT — tidak SELECT kolom lain.
     */
    public function countActiveQueue(int $tenantId, Carbon $today): int
    {
        return (int) DB::selectOne(
            'SELECT COUNT(*) AS total
               FROM "Tr_transactions"
              WHERE tenant_id  = ?
                AND status     IN (\'PENDING\', \'PROCESS\')
                AND order_date >= ?
                AND deleted_at IS NULL',
            [$tenantId, $today->copy()->startOfDay()]
        )->total;
    }

    /**
     * Menunggu pickup: DONE tapi actual_pickup_date masih NULL.
     * Index: status + deleted_at → pilih idx_trans_report_fast.
     */
    public function countWaitingPickup(int $tenantId): int
    {
        return (int) DB::selectOne(
            'SELECT COUNT(*) AS total
               FROM "Tr_transactions"
              WHERE tenant_id         = ?
                AND status            = \'DONE\'
                AND actual_pickup_date IS NULL
                AND deleted_at         IS NULL',
            [$tenantId]
        )->total;
    }

    /**
     * Invoice belum lunas: UNPAID atau PARTIAL.
     */
    public function countUnpaidInvoices(int $tenantId): int
    {
        return (int) DB::selectOne(
            'SELECT COUNT(*) AS total
               FROM "Tr_transactions"
              WHERE tenant_id     = ?
                AND payment_status IN (\'UNPAID\', \'PARTIAL\')
                AND deleted_at     IS NULL',
            [$tenantId]
        )->total;
    }

    // ─── 3. GRAFIK PENJUALAN 7 HARI ──────────────────────────────────────────

    /**
     * Revenue + jumlah transaksi per hari untuk 7 hari terakhir.
     *
     * Satu query GROUP BY DATE — lebih efisien dari 7x query terpisah.
     * PostgreSQL akan menggunakan idx_invoice_speed atau partial scan.
     *
     * Kolom yang diambil: DATE(order_date), SUM(grand_total), COUNT(*)
     */
    public function weeklySalesRaw(int $tenantId, Carbon $start, Carbon $end): array
    {
        return DB::select(
            'SELECT
                DATE(order_date AT TIME ZONE \'Asia/Jakarta\') AS day,
                COALESCE(SUM(grand_total), 0)                 AS revenue,
                COUNT(*)                                       AS tx_count
               FROM "Tr_transactions"
              WHERE tenant_id      = ?
                AND payment_status = \'PAID\'
                AND order_date     BETWEEN ? AND ?
                AND deleted_at     IS NULL
              GROUP BY DATE(order_date AT TIME ZONE \'Asia/Jakarta\')
              ORDER BY day ASC',
            [$tenantId, $start, $end]
        );
    }

    // ─── 4. TRANSAKSI TERBARU ─────────────────────────────────────────────────

    /**
     * 5 transaksi terbaru.
     *
     * SELECT hanya kolom yang ditampilkan di tabel/card React:
     *   invoice_no, customer_name, grand_total, status, payment_status, order_date
     *
     * TIDAK mengambil: notes, tax_amount, discount_amount, dsb.
     * Index: ORDER BY order_date DESC → pakai idx_queue_logic atau PK reverse scan.
     */
    public function recentTransactions(int $tenantId, int $limit = 5): array
    {
        return DB::select(
            'SELECT
                id,
                invoice_no,
                customer_name,
                grand_total,
                status,
                payment_status,
                order_date
               FROM "Tr_transactions"
              WHERE tenant_id  = ?
                AND deleted_at IS NULL
              ORDER BY order_date DESC
              LIMIT ?',
            [$tenantId, $limit]
        );
    }

    // ─── 5. STATUS DISTRIBUTION ───────────────────────────────────────────────

    /**
     * Distribusi status transaksi dalam period.
     * Kolom: status, COUNT(*) saja.
     */
    public function statusDistribution(int $tenantId, Carbon $start, Carbon $end): array
    {
        return DB::select(
            'SELECT
                status,
                COUNT(*) AS total
               FROM "Tr_transactions"
              WHERE tenant_id  = ?
                AND order_date BETWEEN ? AND ?
                AND deleted_at IS NULL
              GROUP BY status
              ORDER BY total DESC',
            [$tenantId, $start, $end]
        );
    }

    // ─── 6. TOP PACKAGES ─────────────────────────────────────────────────────

    /**
     * Paket terlaris berdasarkan total revenue.
     *
     * JOIN Tr_transaction_details → Tr_transactions untuk filter period + tenant.
     * Index: idx_detail_tenant_trans + idx_trans_report_fast.
     *
     * Kolom: package_name, SUM(qty), SUM(subtotal), COUNT(DISTINCT transaction_id)
     * Tidak mengambil kolom lain dari detail.
     */
    public function topPackages(int $tenantId, Carbon $start, Carbon $end, int $limit = 5): array
    {
        return DB::select(
            'SELECT
                d.package_name,
                CAST(SUM(d.qty)      AS FLOAT) AS total_qty,
                CAST(SUM(d.subtotal) AS FLOAT) AS total_revenue,
                COUNT(DISTINCT d.transaction_id)  AS tx_count
               FROM "Tr_transaction_details" d
               JOIN "Tr_transactions" t ON t.id = d.transaction_id
              WHERE d.tenant_id    = ?
                AND t.order_date   BETWEEN ? AND ?
                AND t.deleted_at   IS NULL
                AND d.deleted_at   IS NULL
              GROUP BY d.package_name
              ORDER BY total_revenue DESC
              LIMIT ?',
            [$tenantId, $start, $end, $limit]
        );
    }

    // ─── 7. PAYMENT MIX ──────────────────────────────────────────────────────

    /**
     * Distribusi metode pembayaran dalam period.
     *
     * JOIN Tr_payments → Tr_transactions.
     * Index: idx_pay_tenant_trans + idx_pay_date.
     *
     * Kolom: payment_method_name, COUNT(*), SUM(amount) saja.
     */
    public function paymentMix(int $tenantId, Carbon $start, Carbon $end): array
    {
        return DB::select(
            'SELECT
                p.payment_method_name,
                COUNT(*)                       AS pay_count,
                COALESCE(SUM(p.amount), 0)     AS total
               FROM "Tr_payments" p
               JOIN "Tr_transactions" t ON t.id = p.transaction_id
              WHERE t.tenant_id  = ?
                AND t.order_date BETWEEN ? AND ?
                AND t.deleted_at IS NULL
                AND p.deleted_at IS NULL
              GROUP BY p.payment_method_name
              ORDER BY total DESC',
            [$tenantId, $start, $end]
        );
    }
}