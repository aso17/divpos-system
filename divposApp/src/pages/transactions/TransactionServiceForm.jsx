import Box from "lucide-react/dist/esm/icons/box";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";

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
    <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 flex flex-col flex-1">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-extrabold text-gray-700 text-xs flex items-center gap-2 uppercase tracking-wider">
          <span className="w-7 h-7 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Box size={14} strokeWidth={2.5} />
          </span>
          Pilih Layanan
        </h2>

        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
          {filteredPackages.length} layanan
        </span>
      </div>

      {/* SEARCH */}
      <div className="mb-5 flex items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari layanan..."
            className="w-full border border-gray-200 bg-gray-50 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold transition focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* SERVICES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3">
        {filteredPackages.map((pkg) => {
          const originalPrice = toNum(pkg.original_price);
          const finalPrice = toNum(pkg.final_price);
          const hasDiscount = originalPrice > finalPrice;

          return (
            <button
              key={pkg.id}
              onClick={() => addToCart(pkg)}
              className="relative p-3 border border-gray-100 rounded-2xl bg-white text-left flex flex-col justify-between min-h-[105px] shadow-sm hover:shadow-md hover:border-emerald-400 hover:bg-emerald-50 hover:-translate-y-[2px] active:scale-[0.98] transition-all duration-200 group overflow-hidden"
            >
              {hasDiscount && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-[2px] rounded-bl-xl shadow-sm">
                  PROMO
                </div>
              )}

              <div className="mb-2 mt-3">
                <p className="font-extrabold text-[10px] leading-tight uppercase line-clamp-2 text-gray-700 group-hover:text-emerald-700">
                  {pkg.name}
                </p>
              </div>

              <div className="mt-auto">
                {hasDiscount && (
                  <p className="text-[8px] text-gray-400 line-through mb-[2px]">
                    {formatRupiah(originalPrice)}
                  </p>
                )}

                <div className="flex items-baseline gap-1">
                  <span className="text-[13px] text-emerald-600 font-black">
                    {formatRupiah(finalPrice)}
                  </span>

                  <span className="text-[8px] text-gray-400 font-bold uppercase">
                    /{pkg.unit || "pcs"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* EMPTY */}
      {filteredPackages.length === 0 && (
        <div className="py-14 flex flex-col items-center text-gray-300">
          <Search size={36} strokeWidth={1.5} />

          <p className="text-xs font-bold uppercase mt-3">
            Layanan tidak ditemukan
          </p>

          <p className="text-[10px] text-gray-400 mt-1">Coba kata kunci lain</p>
        </div>
      )}
    </div>
  );
}
