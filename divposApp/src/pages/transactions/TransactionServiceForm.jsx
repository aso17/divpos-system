import React, { memo } from "react";
import Box from "lucide-react/dist/esm/icons/box";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Hash from "lucide-react/dist/esm/icons/hash";

// ── PackageCard: Elegant & Compact ────────────────
const PackageCard = memo(({ pkg, onAdd, formatRupiah, toNum }) => {
  const originalPrice = toNum(pkg.original_price);
  const finalPrice = toNum(pkg.final_price);
  const hasDiscount = originalPrice > finalPrice;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;

  return (
    <button
      onClick={() => onAdd(pkg)}
      className="relative group flex flex-col justify-between text-left
        bg-white border border-gray-100 rounded-2xl p-3.5
        shadow-sm hover:shadow-md hover:border-emerald-300 hover:bg-emerald-50/50
        hover:-translate-y-0.5 active:scale-[0.97]
        transition-all duration-300 min-h-[130px] overflow-hidden"
    >
      {hasDiscount && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-red-600 to-red-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-xl shadow-sm z-10">
          {discountPct}% OFF
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 w-fit px-2 py-0.5 rounded-lg border border-gray-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
          <Hash size={7} strokeWidth={3} />
          {pkg.code || "N/A"}
        </div>
        <p className="font-bold text-[11px] leading-snug text-gray-700 group-hover:text-emerald-800 line-clamp-2 uppercase tracking-tight transition-colors">
          {pkg.name}
        </p>
      </div>

      <div className="mt-auto pt-3">
        {hasDiscount && (
          <p className="text-[9px] text-gray-400 line-through leading-none mb-1">
            {formatRupiah(originalPrice)}
          </p>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-emerald-600 leading-none">
            {formatRupiah(finalPrice)}
          </span>
          <span className="text-[9px] text-gray-400 font-bold uppercase italic">
            /{pkg.unit || "pax"}
          </span>
        </div>
      </div>

      {/* Luxury Hover Indicator */}
      <div className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-600 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-emerald-200 translate-y-2 group-hover:translate-y-0">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    </button>
  );
});
PackageCard.displayName = "PackageCard";

// ── Main Component ────────────────────────────────
export default function TransactionServiceForm({
  filteredPackages,
  services,
  visibleCategories,
  activeServiceId,
  activeCategoryId,
  onServiceChange,
  setActiveCategoryId,
  search,
  setSearch,
  addToCart,
  formatRupiah,
  toNum,
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden transition-all duration-500">
      {/* ── Header: More Breathing Room ── */}
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 flex-shrink-0 rotate-3 group-hover:rotate-0 transition-transform">
            <Box size={18} strokeWidth={2.2} className="text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-black text-gray-800 tracking-tight leading-tight">
              Pilih Layanan
            </h2>
            <p className="text-[10px] font-medium text-gray-400 mt-0.5">
              Klik kartu untuk menambahkan item
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full shadow-sm">
            {filteredPackages.length} ITEM
          </span>
        </div>
      </div>

      {/* ── Luxury Search Bar ── */}
      <div className="px-6 pt-5 pb-4">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-0 group-focus-within:opacity-10 transition duration-300 blur"></div>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors duration-300">
              <Search size={16} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama layanan premium..."
              className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-2xl pl-11 pr-11 text-[13px] font-bold text-gray-700 
                placeholder:text-gray-300 placeholder:font-medium transition-all duration-300 outline-none
                focus:bg-white focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-500/5 shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 p-1.5 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters Container ── */}
      <div className="px-6 space-y-3 pb-4">
        {/* Service Tabs */}
        {services.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => onServiceChange(null)}
              className={`text-[11px] font-black px-4 py-2 rounded-xl border transition-all duration-300 uppercase tracking-tighter
                ${
                  !activeServiceId
                    ? "bg-gray-900 text-white border-gray-900 shadow-md"
                    : "bg-white text-gray-400 border-gray-200 hover:border-emerald-200 hover:text-emerald-600"
                }`}
            >
              Semua
            </button>
            {services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => onServiceChange(svc.id)}
                className={`text-[11px] font-black px-4 py-2 rounded-xl border transition-all duration-300 uppercase tracking-tighter
                  ${
                    activeServiceId === svc.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
                      : "bg-white text-gray-400 border-gray-200 hover:border-emerald-200 hover:text-emerald-600"
                  }`}
              >
                {svc.name}
              </button>
            ))}
          </div>
        )}

        {/* Category Tabs */}
        {visibleCategories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-300
                ${
                  !activeCategoryId
                    ? "bg-gray-100 text-gray-800 border-gray-200"
                    : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                }`}
            >
              All Category
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-300
                  ${
                    activeCategoryId === cat.id
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                      : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid Area ── */}
      <div className="px-6 pb-6 overflow-y-auto flex-1 scrollbar-hide">
        {filteredPackages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onAdd={addToCart}
                formatRupiah={formatRupiah}
                toNum={toNum}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-5 text-gray-200 border border-gray-100">
              <Search size={32} strokeWidth={1} />
            </div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
              Tidak Ada Hasil
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Coba kata kunci atau kategori lain
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
