// components/TablePagination.jsx
// Update: layout responsif — compact di mobile, penuh di desktop

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function TablePagination({ table, totalEntries }) {
  const { pageIndex, pageSize } = table.options.state.pagination;

  const totalRows = totalEntries || 0;
  const pageCount = Math.ceil(totalRows / pageSize) || 1;
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  // ── Compact page numbers with ellipsis ────────────────────────────────────
  const buildPages = () => {
    const delta = 1;
    const pages = [];
    for (let i = 0; i < pageCount; i++) {
      if (
        i === 0 ||
        i === pageCount - 1 ||
        (i >= pageIndex - delta && i <= pageIndex + delta)
      ) {
        pages.push(i);
      }
    }
    const result = [];
    let prev = null;
    for (const p of pages) {
      if (prev !== null && p - prev > 1) result.push("...");
      result.push(p);
      prev = p;
    }
    return result;
  };

  const pages = buildPages();

  const NavBtn = ({ onClick, disabled, label, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center
        text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50
        disabled:opacity-30 disabled:cursor-not-allowed
        disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-400
        transition-all duration-150 flex-shrink-0"
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3">
      {/* ── Left: entry info + per-page ── */}
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-semibold
            text-gray-600 outline-none cursor-pointer
            hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
            transition-all"
        >
          {[5, 10, 20, 50].map((s) => (
            <option key={s} value={s}>
              {s} baris
            </option>
          ))}
        </select>

        <div className="w-px h-4 bg-gray-200 hidden sm:block" />

        <p className="text-xs text-gray-400">
          <span className="font-semibold text-gray-600">
            {startRow}–{endRow}
          </span>{" "}
          dari <span className="font-semibold text-gray-600">{totalRows}</span>{" "}
          data
        </p>
      </div>

      {/* ── Right: page navigation ── */}
      <div className="flex items-center gap-1.5">
        <NavBtn
          onClick={() => table.setPageIndex(0)}
          disabled={!canPrev}
          label="Pertama"
        >
          <ChevronsLeft size={14} strokeWidth={2.5} />
        </NavBtn>
        <NavBtn
          onClick={() => table.previousPage()}
          disabled={!canPrev}
          label="Sebelumnya"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </NavBtn>

        {/* Page number pills */}
        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === "..." ? (
              <span
                key={`e${i}`}
                className="w-8 text-center text-xs text-gray-300"
              >
                ···
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => table.setPageIndex(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150
                  ${
                    p === pageIndex
                      ? "bg-emerald-600 text-white border border-emerald-600 shadow-sm shadow-emerald-200"
                      : "border border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
                  }`}
              >
                {p + 1}
              </button>
            ),
          )}
        </div>

        <NavBtn
          onClick={() => table.nextPage()}
          disabled={!canNext}
          label="Berikutnya"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </NavBtn>
        <NavBtn
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!canNext}
          label="Terakhir"
        >
          <ChevronsRight size={14} strokeWidth={2.5} />
        </NavBtn>
      </div>
    </div>
  );
}
