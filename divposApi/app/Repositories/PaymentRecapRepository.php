<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Tr_Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentRecapRepository
{
    private function listQuery(array $filters): Builder
    {
        return $this->applyFilters(
            Tr_Transaction::query()
                ->select([
                    'Tr_transactions.id',
                    'Tr_transactions.invoice_no',
                    'Tr_transactions.customer_name',
                    'Tr_transactions.customer_phone',
                    'Tr_transactions.order_date',
                    'Tr_transactions.grand_total',
                    'Tr_transactions.discount_amount',
                    'Tr_transactions.tax_amount',
                    'Tr_transactions.status',
                    'Tr_transactions.payment_status',
                    DB::raw('COALESCE(SUM("Tr_payments"."amount"), 0) AS total_paid'),
                    DB::raw('MAX("Tr_payments"."payment_method_name") AS payment_method_name'),
                    DB::raw('"Ms_outlets"."name" AS outlet_name'),
                ])
                ->join('Ms_outlets', 'Ms_outlets.id', '=', 'Tr_transactions.outlet_id')
                ->leftJoin(
                    'Tr_payments',
                    fn ($join) => $join
                        ->on('Tr_payments.transaction_id', '=', 'Tr_transactions.id')
                        ->whereNull('Tr_payments.deleted_at')
                )
                ->groupBy([
                    'Tr_transactions.id',
                    'Tr_transactions.invoice_no',
                    'Tr_transactions.customer_name',
                    'Tr_transactions.customer_phone',
                    'Tr_transactions.order_date',
                    'Tr_transactions.grand_total',
                    'Tr_transactions.discount_amount',
                    'Tr_transactions.tax_amount',
                    'Tr_transactions.status',
                    'Tr_transactions.payment_status',
                    'Ms_outlets.name',
                ]),
            $filters
        );
    }

    /**
     * Summary ini menghitung:
     * - total_transactions : jumlah invoice unik
     * - total_revenue      : SUM grand_total (tagihan)
     * - total_paid         : SUM amount dari Tr_payments (uang masuk nyata)
     * - total_unpaid       : total_revenue - total_paid untuk status != PAID
     */
    private function summaryQuery(array $filters): Builder
    {
        return $this->applyFilters(
            Tr_Transaction::query()
                ->join('Ms_outlets', 'Ms_outlets.id', '=', 'Tr_transactions.outlet_id')
                ->leftJoin(
                    'Tr_payments',
                    fn ($join) => $join
                        ->on('Tr_payments.transaction_id', '=', 'Tr_transactions.id')
                        ->whereNull('Tr_payments.deleted_at')
                ),
            $filters
        );
    }

    /**
     * Satu sumber filter — berlaku untuk list, summary, dan export.
     */
    private function applyFilters(Builder $query, array $filters): Builder
    {
        $tenantId = Auth::user()->tenant_id;

        $query
            ->where('Tr_transactions.tenant_id', $tenantId)
            ->whereBetween('Tr_transactions.order_date', [
                $filters['date_from'] . ' 00:00:00',
                $filters['date_to']   . ' 23:59:59',
            ]);

        // Keyword: invoice_no, customer_name, customer_phone
        if (!empty($filters['keyword'])) {
            $kw = '%' . $filters['keyword'] . '%';
            $query->where(function (Builder $q) use ($kw) {
                $q->where('Tr_transactions.invoice_no', 'like', $kw)
                  ->orWhere('Tr_transactions.customer_name', 'like', $kw)
                  ->orWhere('Tr_transactions.customer_phone', 'like', $kw);
            });
        }

        if (!empty($filters['outlet_id'])) {
            $query->where('Tr_transactions.outlet_id', $filters['outlet_id']);
        }


        if (!empty($filters['payment_method_id'])) {
            $query->where('Tr_payments.payment_method_id', $filters['payment_method_id']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('Tr_transactions.payment_status', $filters['payment_status']);
        }

        return $query;
    }

    /**
     * Paginasi.
     */
    public function paginate(array $filters, int $perPage, int $page): LengthAwarePaginator
    {
        return $this->listQuery($filters)
            ->orderByDesc('Tr_transactions.order_date')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Summary stats — satu query agregat, fully double-quoted untuk PostgreSQL.
     */
    public function getSummary(array $filters): array
    {
        $row = $this->summaryQuery($filters)
            ->selectRaw('
                COUNT(DISTINCT "Tr_transactions"."id")                   AS total_transactions,
                COALESCE(SUM("Tr_transactions"."grand_total"), 0)        AS total_revenue,
                COALESCE(SUM("Tr_payments"."amount"), 0)                 AS total_paid,
                COALESCE(SUM(
                    CASE WHEN "Tr_transactions"."payment_status" != \'PAID\'
                    THEN (
                        "Tr_transactions"."grand_total"
                        - COALESCE((
                            SELECT SUM(p2."amount")
                            FROM "Tr_payments" p2
                            WHERE p2."transaction_id" = "Tr_transactions"."id"
                              AND p2."deleted_at" IS NULL
                        ), 0)
                    )
                    ELSE 0 END
                ), 0)                                                    AS total_unpaid
            ')
            ->first();

        return [
            'total_transactions' => (int)   ($row->total_transactions ?? 0),
            'total_revenue'      => (float)  ($row->total_revenue      ?? 0),
            'total_paid'         => (float)  ($row->total_paid         ?? 0),
            'total_unpaid'       => (float)  ($row->total_unpaid       ?? 0),
        ];
    }

    /**
     * Semua data tanpa paginasi untuk export.
     */
    public function getAll(array $filters): Collection
    {
        return $this->listQuery($filters)
            ->orderByDesc('Tr_transactions.order_date')
            ->get();
    }
}
