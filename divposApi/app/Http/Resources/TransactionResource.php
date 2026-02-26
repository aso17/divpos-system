<?php

namespace App\Http\Resources;

use App\Helpers\CryptoHelper; 
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        return [
            // Enkripsi ID agar aman di sisi Client (React)
            'id'             => CryptoHelper::encrypt($this->id),
            'invoice_no'     => $this->invoice_no,
            
            // Mengambil nama dari relasi 'customer' (Ms_Customer)
            // Jika null, gunakan kolom 'customer_name' manual yang ada di tabel transaksi
            'customer_name'  => $this->customer->name ?? $this->customer_name ?? 'Umum',
            'customer_phone' => $this->customer->phone ?? $this->customer_phone ?? '-',
            
            // Relasi ke Ms_Outlet
            'outlet_name'    => $this->outlet->name ?? '-',
            
            // Sesuaikan dengan nama kolom di model Mas (grand_total)
            'total_price'    => (float) ($this->grand_total ?? 0),
            
            // Gunakan nama relasi 'initialPaymentMethod' sesuai di Model Mas
            'payment_method' => $this->initialPaymentMethod->name ?? '-',
            
            // Status untuk label di tabel
            'status'         => $this->status,
            'payment_status' => $this->payment_status,
            
            // Format tanggal konsisten dengan ServiceResource
            'created_at'     => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
            'order_date'     => $this->order_date ? $this->order_date->format('Y-m-d H:i:s') : null,
        ];
    }
}