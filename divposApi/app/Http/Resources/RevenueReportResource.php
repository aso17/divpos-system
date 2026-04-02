<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RevenueReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'invoice_no'           => $this->invoice_no,
            'order_date'           => $this->order_date?->format('Y-m-d H:i'),
            'order_date_label'     => $this->order_date?->translatedFormat('d M Y'),
            'pickup_date'          => $this->pickup_date?->format('Y-m-d H:i'),
            'actual_pickup_date'   => $this->actual_pickup_date?->format('Y-m-d H:i'),

            // Outlet
            'outlet_id'            => $this->outlet_id,
            'outlet_name'          => $this->outlet?->name,

            // Customer
            'customer_id'          => $this->customer_id,
            'customer_name'        => $this->customer_name ?? 'General',
            'customer_phone'       => $this->customer_phone,

            // Financial
            'total_base_price'     => (float) $this->total_base_price,
            'discount_amount'      => (float) $this->discount_amount,
            'tax_amount'           => (float) $this->tax_amount,
            'grand_total'          => (float) $this->grand_total,
            'dp_amount'            => (float) $this->dp_amount,
            'payment_amount'       => (float) $this->payment_amount,
            'change_amount'        => (float) $this->change_amount,
            'total_paid'           => (float) $this->total_paid,
            'outstanding'          => (float) ($this->grand_total - $this->total_paid),

            // Payment - DISINKRONKAN dengan Model (initialPaymentMethod)
            'payment_method_id'    => $this->payment_method_id,
            'payment_method_name'  => $this->initialPaymentMethod?->name,
            'payment_method_type'  => $this->initialPaymentMethod?->type,

            // Status
            'status'               => $this->status,
            'payment_status'       => $this->payment_status,
            'notes'                => $this->notes,

            // Details
            'details'              => RevenueDetailResource::collection($this->whenLoaded('details')),
            'details_count'        => $this->whenCounted('details'),

            // Audit - Mengambil name, jika kosong pakai username
            'created_by_name'      => $this->creator?->name ?? $this->creator?->username ?? '-',
            'created_at'           => $this->created_at?->format('Y-m-d H:i'),
        ];
    }
}
