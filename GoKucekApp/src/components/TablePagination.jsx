export default function TablePagination({ table, fetchData, totalCount }) {
  // Hitung jumlah halaman secara aman
  const pageSize = table.getState().pagination.pageSize;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.ceil(totalCount / pageSize) || 1;

  // Fungsi navigasi yang lebih aman
  const handlePageChange = (action) => {
    action();
    // Opsional: Jika Anda ingin memicu fetch manual dari sini
    if (typeof fetchData === "function") {
      fetchData({ pageIndex, pageSize });
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
      <div className="text-sm text-slate-600">
        Page{" "}
        <strong>
          {pageIndex + 1} of {pageCount}
        </strong>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-white transition-colors"
        >
          ⏮
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-white transition-colors"
        >
          ◀
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-white transition-colors"
        >
          ▶
        </button>
        <button
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-white transition-colors"
        >
          ⏭
        </button>

        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="ml-2 border rounded px-2 py-1 text-sm bg-white"
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
