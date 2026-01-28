export default function TablePagination({ table }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const totalRows = table.getRowCount();

  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t bg-white">
      {/* LEFT: Info */}
      <div className="text-xs sm:text-sm text-slate-600">
        <div>
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {startRow}-{endRow}
          </span>{" "}
          of <span className="font-semibold text-slate-800">{totalRows}</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Page {pageIndex + 1} of {pageCount}
        </div>
      </div>

      {/* RIGHT: Controls */}
      <div className="flex items-center gap-1">
        {[
          {
            label: "⏮",
            onClick: () => table.setPageIndex(0),
            disabled: !table.getCanPreviousPage(),
          },
          {
            label: "◀",
            onClick: () => table.previousPage(),
            disabled: !table.getCanPreviousPage(),
          },
          {
            label: "▶",
            onClick: () => table.nextPage(),
            disabled: !table.getCanNextPage(),
          },
          {
            label: "⏭",
            onClick: () => table.setPageIndex(pageCount - 1),
            disabled: !table.getCanNextPage(),
          },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className="h-8 w-8 flex items-center justify-center rounded-md border bg-white text-sm
                       hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all"
          >
            {btn.label}
          </button>
        ))}

        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="ml-2 h-8 rounded-md border px-2 text-xs sm:text-sm bg-white
                     hover:border-slate-400 outline-none transition-all"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
