import { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ShieldCheck, Save, ArrowLeft } from "lucide-react";
import LoadingDots from "../../components/common/LoadingDots";
import AppHead from "../../components/common/AppHead";
import RolesService from "../../services/RoleService";

export default function RolePermissionList() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await RolesService.getRolePermissions(roleId);
      setData(res.data?.permissions || []);
      setRoleInfo(res.data?.role || null);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleToggle = (menuId, field) => {
    setData((prev) =>
      prev.map((item) =>
        item.menu_id === menuId ? { ...item, [field]: !item[field] } : item,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await RolesService.updatePermissions(roleId, { permissions: data });
      alert("Permissions updated successfully!");
    } catch (err) {
      alert("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => {
    // 1. Kolom Statis (Nama Menu)
    const baseColumns = [
      {
        accessorKey: "menu_name",
        header: "MENU / MODUL",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-gray-800 font-bold text-xxs uppercase leading-tight">
              {row.original.menu_name}
            </span>
            <span className="text-slate-400 text-[9px]">
              ID: {row.original.menu_id}
            </span>
          </div>
        ),
      },
    ];

    // 2. Kolom Dinamis (Checkboxes)
    const permissionFields = [
      { id: "can_view", label: "VIEW" },
      { id: "can_create", label: "CREATE" },
      { id: "can_update", label: "UPDATE" },
      { id: "can_delete", label: "DELETE" },
      { id: "can_export", label: "EXPORT" },
    ];

    const dynamicColumns = permissionFields.map((field) => ({
      accessorKey: field.id,
      header: () => <div className="text-center">{field.label}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={!!row.original[field.id]}
            onChange={() => handleToggle(row.original.menu_id, field.id)}
            className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer transition-all"
          />
        </div>
      ),
    }));

    return [...baseColumns, ...dynamicColumns];
  }, [data]); // Penting: columns harus update saat data (checkbox) berubah

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    );

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen text-xxs">
      <AppHead title={`Permission - ${roleInfo?.role_name || "Role"}`} />

      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3 text-slate-700">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-200 rounded-full transition-all text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-xs font-bold uppercase tracking-tight">
              Role:{" "}
              <span className="text-indigo-600">{roleInfo?.role_name}</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono italic">
              Code: {roleInfo?.code}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded shadow-sm text-xxs font-bold uppercase hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <LoadingDots size={8} color="white" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="bg-slate-50 border-b border-slate-200"
                >
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-bold text-left text-[10px] text-slate-500 tracking-wider uppercase border-r border-slate-100 last:border-0"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-indigo-50/40 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-2.5 border-r border-slate-50 last:border-0 align-middle"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
        <p italic>
          Perubahan bersifat sementara sebelum Anda menekan tombol "Save
          Changes".
        </p>
      </div>
    </div>
  );
}
