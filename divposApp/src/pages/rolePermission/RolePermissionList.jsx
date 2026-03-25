import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Layers from "lucide-react/dist/esm/icons/layers";
import Save from "lucide-react/dist/esm/icons/save";

import LoadingDots from "../../components/common/LoadingDots";
import AppHead from "../../components/common/AppHead";
import RolesService from "../../services/RolespermissionService";
import SubmitButton from "../../components/SubmitButton";

const PERMISSION_FIELDS = [
  "can_view",
  "can_create",
  "can_update",
  "can_delete",
  "can_export",
];
const PERMISSION_LABELS = {
  can_view: "view",
  can_create: "add",
  can_update: "edit",
  can_delete: "del",
  can_export: "exp",
};

export default function RolePermissionList() {
  const { roleId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerToast = useCallback((message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } })
    );
  }, []);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await RolesService.getRolePermissions(roleId);
      setData(res.data?.data || []);
      if (res.data?.role) setRoleInfo(res.data.role);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      triggerToast("Gagal mengambil data hak akses", "error");
    } finally {
      setLoading(false);
    }
  }, [roleId, triggerToast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await RolesService.updatePermissions(roleId, { permissions: data });
      triggerToast("Hak akses berhasil diperbarui!", "success");
    } catch {
      triggerToast("Gagal menyimpan perubahan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIX: useCallback agar tidak jadi deps columns yang berubah tiap render
  const handleToggle = useCallback((menuId, field) => {
    setData((prev) =>
      prev.map((item) =>
        item.menu_id === menuId ? { ...item, [field]: !item[field] } : item
      )
    );
  }, []);

  const toggleColumn = useCallback((field) => {
    setData((prev) => {
      const isAllChecked = prev.every((item) => !!item[field]);
      return prev.map((item) => ({ ...item, [field]: !isAllChecked }));
    });
  }, []);

  const toggleRow = useCallback((menuId) => {
    setData((prev) => {
      const row = prev.find((item) => item.menu_id === menuId);
      if (!row) return prev;
      const isAllRowChecked = PERMISSION_FIELDS.every((f) => !!row[f]);
      return prev.map((item) =>
        item.menu_id === menuId
          ? PERMISSION_FIELDS.reduce(
              (acc, f) => ({ ...acc, [f]: !isAllRowChecked }),
              { ...item }
            )
          : item
      );
    });
  }, []);

  // FIX: columns deps adalah handler callbacks saja — BUKAN [data]
  // Sebelumnya [data] menyebabkan columns recreate setiap ada toggle checkbox
  const columns = useMemo(
    () => [
      {
        id: "row_selector",
        header: "ALL",
        cell: ({ row }) => (
          <button
            onClick={() => toggleRow(row.original.menu_id)}
            className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors active:scale-90"
          >
            <CheckSquare size={18} />
          </button>
        ),
      },
      {
        accessorKey: "menu_name",
        header: "MENU / MODUL",
        cell: ({ row }) => (
          <div className="flex flex-col py-1 min-w-[120px]">
            <span className="text-slate-800 font-bold text-[10px] md:text-xs uppercase tracking-tight leading-tight">
              {row.original.menu_name}
            </span>
            <span className="text-slate-400 text-[8px] font-mono opacity-60">
              {row.original.menu_id}
            </span>
          </div>
        ),
      },
      ...PERMISSION_FIELDS.map((field) => ({
        accessorKey: field,
        header: () => (
          <div
            className="flex flex-col items-center gap-1 cursor-pointer group py-2"
            onClick={() => toggleColumn(field)}
          >
            <span className="text-[9px] font-black group-hover:text-emerald-600 transition-colors uppercase tracking-tighter">
              {PERMISSION_LABELS[field]}
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-emerald-400" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center items-center">
            <input
              type="checkbox"
              checked={!!row.original[field]}
              onChange={() => handleToggle(row.original.menu_id, field)}
              className="w-5 h-5 md:w-4 md:h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer transition-all"
            />
          </div>
        ),
      })),
    ],
    [handleToggle, toggleColumn, toggleRow]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading && !roleInfo)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <LoadingDots />
      </div>
    );

  return (
    <div className="p-2 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-24 md:pb-6">
      <AppHead title={`Hak Akses - ${roleInfo?.role_name || "Role"}`} />

      <div className="flex items-center justify-between bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-all border border-slate-100 shadow-sm active:scale-90"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <h1 className="text-[10px] md:text-xs font-black uppercase tracking-tight text-slate-800">
                ROLE:{" "}
                <span className="text-emerald-600">{roleInfo?.role_name}</span>
              </h1>
            </div>
            <p className="text-[7px] text-slate-400 p-2 font-bold tracking-widest uppercase hidden md:block">
              Matrix Kontrol Akses Sistem
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <SubmitButton
            onClick={handleSave}
            isSubmitting={isSubmitting}
            label="Simpan Perubahan"
            className="text-[10px] uppercase py-2 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="bg-slate-50/80 border-b border-slate-100"
                >
                  {hg.headers.map((header, idx) => (
                    <th
                      key={header.id}
                      className={`px-3 py-4 font-black text-center text-[9px] text-slate-400 uppercase tracking-widest ${
                        idx === 1
                          ? "sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                          : ""
                      }`}
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
              {(() => {
                let lastModuleId = null;
                return table.getRowModel().rows.map((row) => {
                  const { module_id, module_name } = row.original;
                  const showGroupHeader = module_id !== lastModuleId;
                  lastModuleId = module_id;
                  return (
                    <React.Fragment key={row.id}>
                      {showGroupHeader && (
                        <tr className="bg-emerald-50/40">
                          <td
                            colSpan={columns.length}
                            className="px-4 py-2 border-y border-emerald-100/50"
                          >
                            <div className="flex items-center gap-2 text-emerald-700">
                              <Layers size={12} className="opacity-50" />
                              <span className="font-black text-[9px] tracking-[0.2em] uppercase">
                                Modul: {module_name}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-slate-50 transition-colors group">
                        {row.getVisibleCells().map((cell, idx) => (
                          <td
                            key={cell.id}
                            className={`px-3 py-3 align-middle border-r border-slate-50 last:border-0 ${
                              idx === 1
                                ? "sticky left-0 z-10 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                                : ""
                            }`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
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

      <div className="md:hidden fixed bottom-6 left-0 right-0 px-4 z-30">
        <button
          disabled={isSubmitting}
          onClick={handleSave}
          className="w-full bg-emerald-600 text-white rounded-2xl py-4 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 border border-emerald-500/50"
        >
          {isSubmitting ? (
            <LoadingDots color="white" />
          ) : (
            <>
              <Save size={18} className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.15em]">
                Simpan Perubahan
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
