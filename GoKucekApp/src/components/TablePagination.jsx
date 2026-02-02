import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function TablePagination({ table }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const totalRows = table.getRowCount();

  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 bg-white border-t border-slate-100">
      {/* LEFT: Stats */}
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
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold">
            {pageIndex + 1}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            of {pageCount}
          </span>
        </div>
      </div>

      {/* RIGHT: Controls */}
      <div className="flex items-center gap-3">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden md:block">
            Rows:
          </span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold bg-slate-50/50 
                       hover:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            {
              icon: <ChevronsLeft size={16} />,
              onClick: () => table.setPageIndex(0),
              disabled: !table.getCanPreviousPage(),
              title: "First Page",
            },
            {
              icon: <ChevronLeft size={16} />,
              onClick: () => table.previousPage(),
              disabled: !table.getCanPreviousPage(),
              title: "Previous Page",
            },
            {
              icon: <ChevronRight size={16} />,
              onClick: () => table.nextPage(),
              disabled: !table.getCanNextPage(),
              title: "Next Page",
            },
            {
              icon: <ChevronsRight size={16} />,
              onClick: () => table.setPageIndex(pageCount - 1),
              disabled: !table.getCanNextPage(),
              title: "Last Page",
            },
          ].map((btn, i) => (
            <button
              key={i}
              title={btn.title}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 
                         hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105
                         active:scale-95
                         disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent
                         transition-all duration-150"
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
