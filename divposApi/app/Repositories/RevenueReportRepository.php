<?php

namespace App\Repositories;

use App\Models\Tr_Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Facades\DB;

class RevenueReportRepository
{
    /* -----------------------------------------------------------------------
     | QUERY BUILDER UTAMA
     | Menggunakan penanganan tanggal default agar query tidak error jika filter kosong.
     * --------------------------------------------------------------------- */
    private function baseQuery(int $tenantId, array $filters): Builder
    {
        // Set default tanggal (bulan ini) jika tidak ada input
        $dateFrom = $filters['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo   = $filters['date_to']   ?? now()->endOfMonth()->toDateString();

        $query = Tr_Transaction::query()
            ->where('Tr_transactions.tenant_id', $tenantId)
            ->whereBetween('order_date', [
                $dateFrom . ' 00:00:00',
                $dateTo   . ' 23:59:59',
            ]);

        // Filter Outlet
        if (!empty($filters['outlet_id'])) {
            $query->where('outlet_id', $filters['outlet_id']);
        }

        // Filter Status Pembayaran (PAID, UNPAID, PARTIAL)
        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        // Filter Metode Pembayaran
        if (!empty($filters['payment_method_id'])) {
            $query->where('payment_method_id', $filters['payment_method_id']);
        }

        // Filter Status Transaksi (COMPLETED, VOID, dll)
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Pencarian Global (Invoice, Nama, HP)
        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function (Builder $q) use ($search) {
                $q->where('invoice_no', 'like', $search)
                  ->orWhere('customer_name', 'like', $search)
                  ->orWhere('customer_phone', 'like', $search);
            });
        }

        return $query;
    }

    /* -----------------------------------------------------------------------
     | GET TRANSACTIONS — Untuk Tabel UI (Paginated)
     * --------------------------------------------------------------------- */
    public function getTransactions(int $tenantId, array $filters): LengthAwarePaginator
    {
        $sortBy  = $filters['sort_by']  ?? 'order_date';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $this->baseQuery($tenantId, $filters)
            ->select([
                'id', 'invoice_no', 'order_date', 'outlet_id', 'customer_name',
                'customer_phone', 'grand_total', 'total_paid', 'payment_method_id',
                'status', 'payment_status', 'created_by', 'created_at'
            ])
            ->with([
                'outlet:id,name',
                'initialPaymentMethod:id,name,type',
                'creator:id,username',
            ])
            ->withCount('details')
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    /* -----------------------------------------------------------------------
     | GET SUMMARY — Metrik Cards (Aggregated)
     * --------------------------------------------------------------------- */
    public function getSummary(int $tenantId, array $filters): array
    {
        $base = $this->baseQuery($tenantId, $filters);

        $agg = (clone $base)
            ->selectRaw("
            COUNT(*) AS total_transactions,
            COALESCE(SUM(grand_total), 0) AS total_grand_total,
            COALESCE(SUM(total_paid), 0) AS total_paid,
            COALESCE(SUM(discount_amount), 0) AS total_discount,
            COALESCE(SUM(tax_amount), 0) AS total_tax,
            SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) AS count_paid,
            SUM(CASE WHEN payment_status = 'PARTIAL' THEN 1 ELSE 0 END) AS count_partial,
            SUM(CASE WHEN payment_status = 'UNPAID' THEN 1 ELSE 0 END) AS count_unpaid
        ")
            ->first();

        // Query Breakdown Tetap Sama
        $byMethod = (clone $base)
            ->join('Ms_payment_methods as pm', 'pm.id', '=', 'Tr_transactions.payment_method_id')
            ->selectRaw('pm.name as method_name, COUNT(*) as trx_count, SUM(total_paid) as amount')
            ->groupBy('pm.id', 'pm.name')
            ->get();

        $byOutlet = (clone $base)
            ->join('Ms_outlets as o', 'o.id', '=', 'Tr_transactions.outlet_id')
            ->selectRaw('o.name as outlet_name, COUNT(*) as trx_count, SUM(grand_total) as amount')
            ->groupBy('o.id', 'o.name')
            ->get();

        $totalCount = (int) $agg->total_transactions;
        $totalRev   = (float) $agg->total_grand_total;

        // --- PERBAIKAN DI SINI: RETURN HARUS SESUAI DENGAN $this['key'] DI RESOURCE ---
        return [
            'total_transactions'  => $totalCount,
            'total_grand_total'   => $totalRev,
            'total_paid'          => (float) $agg->total_paid,
            'total_outstanding'   => $totalRev - (float) $agg->total_paid,
            'total_discount'      => (float) $agg->total_discount,
            'total_tax'           => (float) $agg->total_tax,
            'avg_per_transaction' => $totalCount > 0 ? round($totalRev / $totalCount, 2) : 0,

            // Breakdown status (Key disamakan dengan Resource)
            'count_paid'          => (int) $agg->count_paid,
            'count_partial'       => (int) $agg->count_partial,
            'count_unpaid'        => (int) $agg->count_unpaid,

            // Breakdown list
            'by_payment_method'   => $byMethod,
            'by_outlet'           => $byOutlet,
        ];
    }
    /* -----------------------------------------------------------------------
     | GET FOR EXPORT — Hemat RAM dengan Cursor (LazyCollection)
     * --------------------------------------------------------------------- */
    public function getForExport(int $tenantId, array $filters): LazyCollection
    {
        return $this->baseQuery($tenantId, $filters)
            ->with([
                'outlet:id,name',
                'paymentMethod:id,name',
                'details:id,transaction_id,package_name,qty,price_per_unit,subtotal'
            ])
            ->orderBy('order_date', 'asc')
            ->cursor();
    }
}
