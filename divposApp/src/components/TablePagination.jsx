import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function TablePagination({ table, totalEntries }) {
  const { pageIndex, pageSize } = table.options.state.pagination;

  const totalRows = totalEntries || 0;
  // Kalkulasi manual total halaman
  const pageCount = Math.ceil(totalRows / pageSize) || 1;

  // PAKAI LOGIC MANUAL (Jangan pakai fungsi table.getCan... dulu)
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < pageCount - 1;

  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 bg-white border-t border-slate-100">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="text-slate-900">{startRow}</span> to{" "}
          <span className="text-slate-900">{endRow}</span> of{" "}
          <span className="text-slate-900">{totalRows}</span> entries
        </p>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Page
          </span>
          {/* pageIndex + 1 agar tampilan mulai dari angka 1, bukan 0 */}
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold">
            {pageIndex + 1}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            of {pageCount}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold bg-slate-50/50 outline-none cursor-pointer hover:border-blue-400 transition-all"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPreviousPage}
            className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-20 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!canPreviousPage}
            className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-20 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!canNextPage}
            className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-20 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!canNextPage}
            className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-20 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
