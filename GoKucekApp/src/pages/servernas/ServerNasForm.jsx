import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import ServerNasService from "../../services/ServerNasService";

export default function ServerNasForm({ open, onClose, initialData = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      { router_name: "", connection_type: "", ip_address: "" },
      {
        router_name: [(v) => rules.required(v, "Router name is required")],
        connection_type: [
          (v) => rules.required(v, "Connection type is required"),
        ],
        ip_address: [
          (v, values) =>
            values?.connection_type === "IP_PUBLIC"
              ? rules.required(v, "IP address is required for Public IP")
              : null,
          (v, values) =>
            values?.connection_type === "IP_PUBLIC"
              ? rules.noLetters(v, "IP address must not contain letters")
              : null,
        ],
      },
    );

  useEffect(() => {
    if (open) {
      if (initialData) {
        setValues({
          router_name: initialData.router_name || "",
          connection_type: initialData.connection_type || "",
          ip_address: initialData.ip_address || "",
        });
      } else {
        setValues({ router_name: "", connection_type: "", ip_address: "" });
      }
      setErrors({});
    }
  }, [open, initialData, setValues, setErrors]);

  const handleConnectionTypeChange = (e) => {
    const newType = e.target.value;
    handleChange("connection_type", newType);

    if (newType !== "IP_PUBLIC") {
      setValues((prev) => ({ ...prev, ip_address: "" }));
      setErrors((prev) => ({ ...prev, ip_address: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    const payload = {
      router_name: values.router_name.trim(),
      connection_type: values.connection_type,
      ip_address:
        values.connection_type === "IP_PUBLIC"
          ? values.ip_address.trim()
          : null,
    };

    try {
      setIsSubmitting(true);

      if (initialData?.id) {
        await ServerNasService.updateRouter(initialData.id, payload);
      } else {
        await ServerNasService.createRouter(payload);
      }

      onClose(); // tutup modal setelah sukses
    } catch (err) {
      console.error("Submit failed", err);
      alert(err.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-lg">
        <h2 className="text-xxs font-bold mb-4 text-slate-700 uppercase tracking-wide">
          {initialData ? "Edit Router" : "Add Router"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xxs">
          {/* Router Name */}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">
              Router Name
            </label>
            <input
              value={values.router_name}
              onChange={(e) => handleChange("router_name", e.target.value)}
              className={inputClasses({ error: !!errors.router_name })}
            />
            {errors.router_name && (
              <p className="text-[10px] text-red-500 mt-1">
                {errors.router_name}
              </p>
            )}
          </div>

          {/* Connection Type */}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">
              Connection Type
            </label>
            <select
              value={values.connection_type}
              onChange={handleConnectionTypeChange}
              className={inputClasses({ error: !!errors.connection_type })}
            >
              <option value="">-- Select Type --</option>
              <option value="IP_PUBLIC">Public IP</option>
              <option value="VPN_RADIUS">VPN Radius</option>
            </select>
            {errors.connection_type && (
              <p className="text-[10px] text-red-500 mt-1">
                {errors.connection_type}
              </p>
            )}
          </div>

          {/* IP Address */}
          {values.connection_type === "IP_PUBLIC" && (
            <div>
              <label className="block mb-1 text-slate-600 font-medium">
                IP Address
              </label>
              <input
                value={values.ip_address}
                onChange={(e) => handleChange("ip_address", e.target.value)}
                className={inputClasses({ error: !!errors.ip_address })}
              />
              {errors.ip_address && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.ip_address}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Update" : "Save"}
              loadingLabel="Saving..."
              color="#2563eb"
              fullWidth={false}
              className="text-xs py-1.5 rounded-md"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
