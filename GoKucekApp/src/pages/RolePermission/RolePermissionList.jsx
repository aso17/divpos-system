import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ShieldCheck, ArrowLeft, CheckSquare, Layers } from "lucide-react";
import LoadingDots from "../../components/common/LoadingDots";
import AppHead from "../../components/common/AppHead";
import RolesService from "../../services/RolespermissionService";
import { decrypt } from "../../utils/Encryptions";
import SubmitButton from "../../components/SubmitButton";

export default function RolePermissionList() {
  const { roleId } = useParams();
  const navigate = useNavigate();

  const decryptedId = useMemo(
    () => (roleId ? decrypt(roleId) : null),
    [roleId],
  );

  const [data, setData] = useState([]);
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } }),
    );
  };

  const fetchPermissions = useCallback(async () => {
    if (!decryptedId) return;
    setLoading(true);
    try {
      const res = await RolesService.getRolePermissions(decryptedId);
      const responseData = res.data?.data || res.data;
      setData(responseData.permissions || []);
      if (responseData.role) setRoleInfo(responseData.role);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      triggerToast("Gagal mengambil data hak akses", "error");
    } finally {
      setLoading(false);
    }
  }, [decryptedId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleSave = async () => {
    if (!decryptedId) return;
    setIsSubmitting(true);
    try {
      await RolesService.updatePermissions(decryptedId, { permissions: data });

      triggerToast("Hak akses berhasil diperbarui!", "success");
    } catch (err) {
      triggerToast("Gagal menyimpan perubahan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = (menuId, field) => {
    setData((prev) =>
      prev.map((item) =>
        item.menu_id === menuId ? { ...item, [field]: !item[field] } : item,
      ),
    );
  };

  const toggleColumn = (field) => {
    const isAllChecked = data.every((item) => !!item[field]);
    setData((prev) =>
      prev.map((item) => ({ ...item, [field]: !isAllChecked })),
    );
  };

  const toggleRow = (menuId) => {
    const fields = [
      "can_view",
      "can_create",
      "can_update",
      "can_delete",
      "can_export",
    ];
    const row = data.find((item) => item.menu_id === menuId);
    if (!row) return;
    const isAllRowChecked = fields.every((f) => !!row[f]);
    setData((prev) =>
      prev.map((item) =>
        item.menu_id === menuId
          ? {
              ...item,
              can_view: !isAllRowChecked,
              can_create: !isAllRowChecked,
              can_update: !isAllRowChecked,
              can_delete: !isAllRowChecked,
              can_export: !isAllRowChecked,
            }
          : item,
      ),
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "row_selector",
        header: "ALL",
        cell: ({ row }) => (
          <button
            onClick={() => toggleRow(row.original.menu_id)}
            className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Pilih Baris"
          >
            <CheckSquare size={16} />
          </button>
        ),
      },
      {
        accessorKey: "menu_name",
        header: "MENU / MODUL",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-[10px] uppercase tracking-wide">
              {row.original.menu_name}
            </span>
            <span className="text-slate-400 text-[9px] font-mono lowercase">
              id: {row.original.menu_id}
            </span>
          </div>
        ),
      },
      ...[
        "can_view",
        "can_create",
        "can_update",
        "can_delete",
        "can_export",
      ].map((field) => {
        const labels = {
          can_view: "view",
          can_create: "create",
          can_update: "update",
          can_delete: "delete",
          can_export: "export",
        };
        return {
          accessorKey: field,
          header: () => (
            <div
              className="flex flex-col items-center gap-1 cursor-pointer group select-none"
              onClick={() => toggleColumn(field)}
            >
              <span className="group-hover:text-indigo-600 transition-colors">
                {labels[field]}
              </span>
              <div className="text-[8px] text-slate-300 group-hover:text-indigo-400 font-bold tracking-tighter">
                TOGGLE
              </div>
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={!!row.original[field]}
                onChange={() => handleToggle(row.original.menu_id, field)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer transition-all"
              />
            </div>
          ),
        };
      }),
    ],
    [data],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading && !roleInfo)
    return (
      <div className="h-[400px] flex items-center justify-center">
        <LoadingDots />
      </div>
    );

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen">
      <AppHead title={`Hak Akses - ${roleInfo?.role_name || "Role"}`} />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-slate-100"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-xs font-black uppercase tracking-tight text-slate-800">
              Peran:{" "}
              <span className="text-indigo-600 text-[12px]">
                {roleInfo?.role_name}
              </span>
            </h1>
            <p className="text-[8px] text-slate-400 font-semibold tracking-widest uppercase">
              Pengaturan Kontrol Akses
            </p>
          </div>
        </div>
        <SubmitButton
          onClick={handleSave}
          isSubmitting={isSubmitting}
          label="Simpan Perubahan"
          fullWidth={false}
          className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
        />
      </div>

      {/* MATRIX TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="bg-slate-50 border-b border-slate-200"
                >
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-4 font-bold text-left text-[10px] text-slate-500 uppercase tracking-widest border-r border-slate-100 last:border-0"
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
              {(() => {
                let lastModuleId = null;
                return table.getRowModel().rows.map((row) => {
                  const { module_id, module_name } = row.original;
                  const showGroupHeader = module_id !== lastModuleId;
                  lastModuleId = module_id;

                  return (
                    <React.Fragment key={row.id}>
                      {showGroupHeader && (
                        <tr className="bg-slate-50/50">
                          <td
                            colSpan={columns.length}
                            className="px-4 py-3 border-y border-slate-200 bg-slate-100/30"
                          >
                            <div className="flex items-center gap-2 text-indigo-700">
                              <Layers size={14} className="opacity-70" />
                              <span className="font-black text-[10px] tracking-[0.2em] uppercase">
                                Modul {module_name}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-indigo-50/20 transition-colors group">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-2 border-r border-slate-50 last:border-0 align-middle"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
