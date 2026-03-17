// TransactionServiceForm.jsx
// Logic: TIDAK DIUBAH — hanya styling

import Box from "lucide-react/dist/esm/icons/box";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Tag from "lucide-react/dist/esm/icons/tag";

export default function TransactionServiceForm({
  packages,
  filteredPackages,
  search,
  setSearch,
  addToCart,
  formatRupiah,
  toNum,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
      {/* ── Card Header ── */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
            <Box size={14} strokeWidth={2.5} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 leading-tight">
              Pilih Layanan
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Ketuk layanan untuk menambah ke keranjang
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          {filteredPackages.length} layanan
        </span>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-5 pt-4 pb-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari layanan atau kategori..."
            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-9 text-sm font-medium text-gray-700 placeholder:text-gray-300
              transition-all duration-150 outline-none
              focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Package Grid ── */}
      <div className="px-5 pb-5 overflow-y-auto flex-1">
        {filteredPackages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredPackages.map((pkg) => {
              const originalPrice = toNum(pkg.original_price);
              const finalPrice = toNum(pkg.final_price);
              const hasDiscount = originalPrice > finalPrice;
              const discountPct = hasDiscount
                ? Math.round(
                    ((originalPrice - finalPrice) / originalPrice) * 100,
                  )
                : 0;

              return (
                <button
                  key={pkg.id}
                  onClick={() => addToCart(pkg)}
                  className="relative group flex flex-col justify-between text-left
                    bg-white border border-gray-100 rounded-2xl p-3.5
                    shadow-sm hover:shadow-md hover:border-emerald-300 hover:bg-emerald-50/50
                    hover:-translate-y-0.5 active:scale-[0.97]
                    transition-all duration-200 min-h-[110px] overflow-hidden"
                >
                  {/* Discount badge */}
                  {hasDiscount && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-0.5 shadow-sm">
                      <Tag size={7} />
                      {discountPct}% OFF
                    </div>
                  )}

                  {/* Package name */}
                  <p
                    className="font-bold text-[11px] leading-snug text-gray-700
                    group-hover:text-emerald-700 line-clamp-2 uppercase tracking-tight
                    transition-colors duration-150 mt-1 pr-6"
                  >
                    {pkg.name}
                  </p>

                  {/* Price area */}
                  <div className="mt-auto pt-2">
                    {hasDiscount && (
                      <p className="text-[9px] text-gray-400 line-through leading-none mb-0.5">
                        {formatRupiah(originalPrice)}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-emerald-600 leading-none">
                        {formatRupiah(finalPrice)}
                      </span>
                      <span className="text-[9px] text-gray-400 font-semibold uppercase">
                        /{pkg.unit || "pcs"}
                      </span>
                    </div>
                  </div>

                  {/* Hover: add indicator */}
                  <div
                    className="absolute bottom-2.5 right-2.5 w-5 h-5 bg-emerald-600 rounded-full
                    flex items-center justify-center opacity-0 group-hover:opacity-100
                    transition-opacity duration-150 shadow-sm"
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <Search size={24} strokeWidth={1.5} className="text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400">
              Layanan tidak ditemukan
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Coba kata kunci yang berbeda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
