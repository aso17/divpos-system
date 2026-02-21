import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";

// Import Service
import PackageService from "../../services/PackageService";
import MasterService from "../../services/MasterService";
import CategoryService from "../../services/CategoryService";

export default function PackageForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        service_id: "",
        category_id: "",
        code: "",
        name: "",
        description: "",
        price: "",
        unit: "Kg",
        min_order: 1,
        is_active: true,
      },
      {
        service_id: [(v) => rules.required(v, "Layanan wajib dipilih")],
        category_id: [(v) => rules.required(v, "Kategori wajib dipilih")],
        code: [(v) => rules.required(v, "Kode wajib diisi")],
        name: [(v) => rules.required(v, "Nama paket wajib diisi")],
        price: [(v) => rules.required(v, "Harga wajib diisi")],
        unit: [(v) => rules.required(v, "Satuan wajib diisi")],
      },
    );

  useEffect(() => {
    if (open) {
      const loadOptions = async () => {
        try {
          const [resSvc, resCat] = await Promise.all([
            MasterService.getMasterServices(),
            CategoryService.getCategories(),
          ]);
          setServices(resSvc.data?.data || []);
          setCategories(resCat.data?.data || []);
        } catch (err) {
          console.error("Failed to load options", err);
        }
      };
      loadOptions();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setValues({
        service_id: initialData.service_id || "",
        category_id: initialData.category_id || "",
        code: initialData.code || "",
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        unit: initialData.unit || "Kg",
        min_order: initialData.min_order || 1,
        is_active: initialData.is_active == 1 || initialData.is_active === true,
      });
    } else {
      setValues({
        service_id: "",
        category_id: "",
        code: "",
        name: "",
        description: "",
        price: "",
        unit: "Kg",
        min_order: 1,
        is_active: true,
      });
    }
    setErrors({});
  }, [open, initialData, setValues, setErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = { ...values, is_active: values.is_active ? 1 : 0 };

      let response;

      if (initialData?.id) {
        response = await PackageService.updatePackage(initialData.id, payload);
      } else {
        response = await PackageService.createPackage(payload);
      }
      console.log(response);
      triggerToast(response.data?.message || "Success", "success");
      onSuccess?.(response.data?.data);
      onClose();
    } catch (err) {
      triggerToast(
        err.response?.data?.message || "Something went wrong",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", {
        detail: { message, type },
      }),
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs font-medium">
      <div className="bg-white rounded-[1.5rem] w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[95vh] border border-slate-100">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
            {initialData ? "Edit Paket" : "Tambah Paket Baru"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          {/* Dropdowns Row */}
          <div className="col-span-1">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Layanan
            </label>
            <select
              value={values.service_id}
              onChange={(e) => handleChange("service_id", e.target.value)}
              className={`${inputClasses({ error: !!errors.service_id })} py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
            >
              <option value="">Pilih Layanan</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Kategori
            </label>
            <select
              value={values.category_id}
              onChange={(e) => handleChange("category_id", e.target.value)}
              className={`${inputClasses({ error: !!errors.category_id })} py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
            >
              <option value="">Pilih Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Kode
            </label>
            <input
              value={values.code}
              onChange={(e) =>
                handleChange("code", e.target.value.toUpperCase())
              }
              disabled={!!initialData}
              className={`${inputClasses({ error: !!errors.code })} py-1.5 font-mono focus:ring-emerald-500 focus:border-emerald-500`}
              placeholder="CUKIL"
            />
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Nama Paket
            </label>
            <input
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`${inputClasses({ error: !!errors.name })} py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
              placeholder="Contoh: Cuci Kiloan"
            />
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Harga (Rp)
            </label>
            <input
              type="number"
              value={values.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className={`${inputClasses({ error: !!errors.price })} py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
            />
          </div>

          <div className="col-span-1 grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
                Unit
              </label>
              <input
                value={values.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                className={`${inputClasses({ error: !!errors.unit })} py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
                Min. Order
              </label>
              <input
                type="number"
                step="0.01"
                value={values.min_order}
                onChange={(e) => handleChange("min_order", e.target.value)}
                className={`${inputClasses({})} py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Deskripsi
            </label>
            <textarea
              value={values.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={`${inputClasses({})} min-h-[50px] py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
              placeholder="..."
            />
          </div>

          <div className="col-span-2 py-1 flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer border-slate-300"
              />
              <span className="text-slate-500 font-bold uppercase text-[9px] group-hover:text-emerald-600 transition-colors">
                Paket Aktif di Kasir
              </span>
            </label>
          </div>

          <div className="col-span-2 flex justify-end gap-2 pt-4 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Update" : "Create"}
              loadingLabel="Processing..."
              fullWidth={false}
              className="text-[10px] font-bold uppercase py-1.5 px-6 rounded shadow-sm shadow-blue-200"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
