import {
  useMemo,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

// Import Lucide Icons
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Zap from "lucide-react/dist/esm/icons/zap";

// Import Components & Services
import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import TablePagination from "../../components/TablePagination";
import CategoryService from "../../services/CategoryService";
import CategoryForm from "./CategoryForm";

// 1. Tambahkan forwardRef
const CategoryList = forwardRef((props, ref) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 2. EXPOSE: Agar Parent bisa manggil fungsi buka modal
  useImperativeHandle(ref, () => ({
    openForm: (category = null) => {
      setSelectedCategory(category);
      setOpenModal(true);
    },
  }));

  const fetchCategories = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await CategoryService.getCategories({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
        });

        if (isMounted) {
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch]
  );

  useEffect(() => {
    let isMounted = true;
    fetchCategories(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchCategories]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleDelete = async (category) => {
    // Gunakan confirm sederhana jika showConfirm tidak diimport
    if (!window.confirm(`Hapus kategori "${category.name}"?`)) return;

    try {
      await CategoryService.deleteCategory(category.id);
      setData((prevData) => prevData.filter((item) => item.id !== category.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "no",
        header: "NO",
        cell: ({ row, table }) => (
          <span className="text-slate-400 font-medium text-[10px]">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              row.index +
              1}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "KATEGORI",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-[10px] uppercase tracking-tight">
              {row.original.name}
            </span>
            <span className="text-[9px] font-mono text-slate-400 italic">
              slug: {row.original.slug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "priority",
        header: "PRIORITAS",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1">
            <Zap
              size={12}
              className={
                getValue() > 0
                  ? "text-amber-500 fill-amber-500"
                  : "text-slate-300"
              }
            />
            <span className="text-slate-600 font-bold text-[10px]">
              Level {getValue()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: "STATUS",
        cell: ({ getValue }) => {
          const isActive = getValue();
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              }`}
            >
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center text-[10px] font-black text-slate-400 uppercase">
            AKSI
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setSelectedCategory(row.original);
                setOpenModal(true);
              }}
              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Search area tetap ada di sini */}
      <div className="flex justify-start px-1">
        <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto md:min-w-[320px]">
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={13}
              />
              <input
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-[11px] outline-none"
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-9 px-4 bg-emerald-600 text-white text-[10px] font-black rounded-lg transition-colors uppercase"
            >
              Cari
            </button>
          </form>
        </div>
      </div>

      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada data kategori tersedia"
        renderMobileCard={(category) => (
          <div
            key={category.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mb-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5 flex-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                  {category.name}
                </h3>
                <span className="text-[7px] font-mono font-bold text-slate-400">
                  slug: {category.slug}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border ${
                  category.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {category.is_active ? "Aktif" : "Off"}
              </div>
            </div>
            <div className="py-2 border-y border-slate-50">
              <div className="flex items-center gap-2">
                <Zap
                  size={10}
                  className={
                    category.priority > 0 ? "text-amber-500" : "text-slate-300"
                  }
                />
                <p className="text-[9px] text-slate-600 font-bold uppercase">
                  Prioritas Level {category.priority}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedCategory(category);
                  setOpenModal(true);
                }}
                className="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 active:scale-95 transition-all"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(category)}
                className="flex-1 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100 active:scale-95 transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        )}
        renderDesktopTable={() => (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-emerald-50/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
              <TablePagination table={table} totalEntries={totalCount} />
            </div>
          </div>
        )}
      />

      <CategoryForm
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedCategory(null);
        }}
        initialData={selectedCategory}
        onSuccess={(newCategory) => {
          if (selectedCategory) {
            setData((prev) =>
              prev.map((c) => (c.id === newCategory.id ? newCategory : c))
            );
          } else {
            setData((prev) => [newCategory, ...prev]);
            setTotalCount((prev) => prev + 1);
          }
          setOpenModal(false);
          setSelectedCategory(null);
        }}
      />
    </div>
  );
});

export default CategoryList;
