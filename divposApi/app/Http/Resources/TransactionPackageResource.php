<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\CryptoHelper;

class TransactionPackageResource extends JsonResource
{
   public function toArray($request)
{
    $original = (float) $this->price;
    $final = (float) $this->final_price;

    return [
        'id'              => CryptoHelper::encrypt($this->id),
        'name'            => $this->name,
        'original_price'  => $original,
        'final_price'     => $final,
        'discount_amount' => (float) $this->discount_value,
        'discount_type'   => $this->discount_type,
        // Logic: Jika ada harga asli yang lebih besar dari harga final, berarti ada diskon
        'has_discount'    => $original > $final && $final > 0,
        'unit'            => $this->unit?->short_name ?? 'Pcs'
    ];
}
}