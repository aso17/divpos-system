// components/common/ResponsiveDataView.jsx
// Update: tambah prop paginationNode agar mobile & tablet punya pagination

import React from "react";
import LoadingDots from "./LoadingDots";

const ResponsiveDataView = ({
  data,
  loading,
  renderMobileCard,
  renderDesktopTable,
  emptyMessage = "Belum ada data tersedia",
  paginationNode, // <TablePagination table={table} totalEntries={totalCount} />
}) => {
  const isEmpty = !loading && data.length === 0;

  // ── Empty state ───────────────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-400">{emptyMessage}</p>
      <p className="text-xs text-gray-300 mt-1">
        Coba ubah filter atau kata kunci
      </p>
    </div>
  );

  // ── Shared card container (mobile single-col / tablet 2-col) ─────────────
  const CardContainer = ({ gridCols }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Cards */}
      <div
        className={`p-3 ${gridCols === 2 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}`}
      >
        {isEmpty ? (
          <div className={gridCols === 2 ? "col-span-2" : ""}>
            <EmptyState />
          </div>
        ) : (
          data.map((item, index) => renderMobileCard(item, index))
        )}
      </div>

      {/* Pagination bar */}
      {paginationNode && !isEmpty && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {paginationNode}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative">
      {/* ── Mobile (< 768px): single column ── */}
      <div className="md:hidden pb-24">
        <CardContainer gridCols={1} />
      </div>

      {/* ── Tablet (768–1024px): 2-column grid ── */}
      <div className="hidden md:block lg:hidden pb-6">
        <CardContainer gridCols={2} />
      </div>

      {/* ── Desktop (≥ 1024px): full table ── */}
      <div className="hidden lg:block">
        {isEmpty ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState />
          </div>
        ) : (
          renderDesktopTable()
        )}
      </div>

      {/* ── Global loading overlay ── */}
      {loading && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center
          bg-white/70 backdrop-blur-[2px] rounded-2xl min-h-[200px]"
        >
          <LoadingDots overlay />
        </div>
      )}
    </div>
  );
};

export default ResponsiveDataView;
