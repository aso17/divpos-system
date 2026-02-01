import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ShieldCheck, ArrowLeft, CheckSquare, Package } from "lucide-react";
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

  const fetchPermissions = useCallback(async () => {
    if (!decryptedId) return;
    setLoading(true);
    try {
      const res = await RolesService.getRolePermissions(decryptedId);
      console.log("Raw response:", decryptedId);
      console.log("Fetched permissions:", res.data);
      const responseData = res.data?.data || res.data;
      setData(responseData.permissions || []);
      if (responseData.role) setRoleInfo(responseData.role);
    } catch (error) {
      console.error("Error fetching permissions:", error);
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
      triggerToast("Permissions updated successfully!", "success");
    } catch (err) {
      triggerToast("Failed to save permissions", "error");
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
            className="p-1 text-slate-300 hover:text-indigo-600"
          >
            <CheckSquare size={14} />
          </button>
        ),
      },
      {
        accessorKey: "menu_name",
        header: "MENU / MODUL",
        cell: ({ row }) => (
          <div className="flex flex-col ml-2 border-l-2 border-slate-100 pl-2">
            <span className="text-gray-800 font-bold text-xxs uppercase">
              {row.original.menu_name}
            </span>
            <span className="text-slate-400 text-[8px]">
              ID: {row.original.menu_id}
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
      ].map((field) => ({
        accessorKey: field,
        header: () => (
          <div
            className="flex flex-col items-center gap-1 cursor-pointer group"
            onClick={() => toggleColumn(field)}
          >
            <span className="group-hover:text-indigo-600">
              {field.replace("can_", "").toUpperCase()}
            </span>
            <div className="text-[7px] text-slate-300 group-hover:text-indigo-400">
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
              className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        ),
      })),
    ],
    [data],
  );

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } }),
    );
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading && !roleInfo)
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingDots />
      </div>
    );

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen text-xxs">
      <AppHead title={`Permission - ${roleInfo?.role_name || "Role"}`} />

      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-indigo-100 shadow-lg">
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
        <SubmitButton
          onClick={handleSave}
          isSubmitting={isSubmitting}
          label="Save Changes"
          fullWidth={false}
          className="w-auto px-5 py-2 bg-emerald-600 text-white rounded shadow-sm text-xxs font-bold uppercase hover:bg-emerald-700"
        />
      </div>

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
                      className="px-4 py-3 font-bold text-left text-[10px] text-slate-500 uppercase border-r border-slate-100 last:border-0"
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
                  const { module_id, module_name, module_icon } = row.original;
                  const showGroupHeader = module_id !== lastModuleId;
                  lastModuleId = module_id;

                  return (
                    <React.Fragment key={row.id}>
                      {showGroupHeader && (
                        <tr className="bg-slate-50/80">
                          <td
                            colSpan={columns.length}
                            className="px-4 py-2.5 border-y border-slate-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-700 text-[10px] tracking-widest uppercase">
                                {module_name}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-indigo-50/30 transition-colors group">
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
