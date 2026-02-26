// components/common/ResponsiveDataView.jsx

import React from "react";
// TAMBAHKAN BARIS INI:
import LoadingDots from "./LoadingDots";

const ResponsiveDataView = ({
  data,
  loading,
  renderMobileCard,
  renderDesktopTable,
  emptyMessage = "Belum ada data tersedia",
}) => {
  return (
    <div className="relative min-h-[400px]">
      {/* View Mobile */}
      <div className="md:hidden space-y-4 px-2 pb-20">
        {data.length > 0
          ? data.map((item, index) => renderMobileCard(item, index))
          : !loading && (
              <div className="p-10 text-center text-slate-400 text-xs italic">
                {emptyMessage}
              </div>
            )}
      </div>

      {/* View Desktop */}
      <div className="hidden md:block">{renderDesktopTable()}</div>

      {/* Overlay Loading */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-[2rem]">
          {/* Komponen ini yang menyebabkan error karena belum di-import tadi */}
          <LoadingDots overlay />
        </div>
      )}
    </div>
  );
};

export default ResponsiveDataView;
