import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { formatRupiah, parseNumber } from "../../utils/formatter";
import { useFormValidation } from "../../hooks/useFormValidation";

// Import Service
import PackageService from "../../services/PackageService";
import MasterService from "../../services/MasterService";
import CategoryService from "../../services/CategoryService";
import UnitService from "../../services/UnitService";

export default function PackageForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const [durType, setDurType] = useState("hour");
  const [durValue, setDurValue] = useState(0);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        service_id: "",
        category_id: "",
        unit_id: "",
        name: "",
        description: "",
        price: 0,
        discount_type: "none",
        discount_value: 0,
        duration_menit: 0, // Ini yang akan dikirim ke DB
        is_weight_based: false,
        min_order: 1,
        is_active: true,
      },
      {
        service_id: [(v) => rules.required(v, "Layanan wajib dipilih")],
        category_id: [(v) => rules.required(v, "Kategori wajib dipilih")],
        unit_id: [(v) => rules.required(v, "Unit wajib dipilih")],
        name: [
          (v) => rules.required(v, "Nama paket wajib diisi"),
          (v) => rules.noHtml(v),
          (v) => rules.safeString(v),
        ],
        price: [
          (v) =>
            v !== "" && v !== null && v !== undefined
              ? true
              : "Harga wajib diisi",
          (v) => (parseFloat(v) > 0 ? true : "Harga harus lebih besar dari 0"),
        ],
        // PERBAIKAN: Rule untuk durasi
        duration_menit: [
          (v) => {
            const val = Number(v);
            if (v === "" || v === null) return "Durasi wajib diisi";
            if (isNaN(val)) return "Durasi harus berupa angka";
            if (val <= 0) return "Durasi harus lebih dari 0";
            return true;
          },
        ],
        discount_value: [
          (v) => {
            if (values.discount_type === "none") return true;
            const val = parseFloat(v);
            if (isNaN(val)) return "Harus berupa angka";
            if (val < 0) return "Tidak boleh negatif";
            return true;
          },
        ],
        min_order: [
          (v) => (v !== "" && v !== null ? true : "Minimal order wajib diisi"),
          (v) => (parseFloat(v) >= 0 ? true : "Tidak boleh negatif"),
        ],
      },
    );

  // PERBAIKAN: Sync durasi menit secara otomatis ke dalam Hook values
  useEffect(() => {
    const totalMinutes =
      durType === "day"
        ? parseFloat(durValue || 0) * 1440
        : parseFloat(durValue || 0) * 60;

    handleChange("duration_menit", totalMinutes);
  }, [durValue, durType]);

  // Load Dropdown Options (Sama seperti sebelumnya)
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const [resSvc, resCat, resUnit] = await Promise.all([
            MasterService.getMasterServices(),
            CategoryService.getCategories(),
            UnitService.getUnits(),
          ]);
          setServices(resSvc.data?.data || []);
          setCategories(resCat.data?.data || []);
          setUnits(resUnit.data?.data || []);
        } catch (err) {
          console.error("Load failed", err);
        }
      })();
    }
  }, [open]);

  // Reset & Edit Logic
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setValues({
        ...initialData,
        is_active: initialData.is_active == 1,
        is_weight_based: initialData.is_weight_based == 1,
      });
      const mins = initialData.duration_menit || 0;
      if (mins > 0 && mins % 1440 === 0) {
        setDurType("day");
        setDurValue(mins / 1440);
      } else {
        setDurType("hour");
        setDurValue(mins / 60);
      }
    } else {
      setValues({
        service_id: "",
        category_id: "",
        unit_id: "",
        name: "",
        description: "",
        price: 0,
        discount_type: "none",
        discount_value: 0,
        duration_menit: 0,
        is_weight_based: false,
        min_order: 1,
        is_active: true,
      });
      setDurValue(0);
      setDurType("hour");
    }
    setErrors({});
  }, [open, initialData, setValues, setErrors]);

  const handleManualChange = (name, value) => {
    let cleanValue = value;

    if (name === "discount_value") {
      if (values.discount_type === "percentage") {
        // 1. Hanya izinkan angka dan satu titik desimal
        cleanValue = value.replace(/[^0-9.]/g, "");

        // 2. Hapus angka 0 di depan jika diikuti angka lain (misal 02 -> 2)
        // Tapi tetap izinkan "0." (misal 0.5)
        if (
          cleanValue.length > 1 &&
          cleanValue.startsWith("0") &&
          cleanValue[1] !== "."
        ) {
          cleanValue = cleanValue.replace(/^0+/, "");
        }
      } else {
        // Untuk mode Rupiah (Fixed), gunakan parseNumber yang sudah ada
        cleanValue = Number(parseNumber(value));
      }
    } else if (name === "min_order") {
      // Sama seperti persentase, bersihkan leading zeros tapi izinkan desimal
      cleanValue = value.replace(/[^0-9.]/g, "");
      if (
        cleanValue.length > 1 &&
        cleanValue.startsWith("0") &&
        cleanValue[1] !== "."
      ) {
        cleanValue = cleanValue.replace(/^0+/, "");
      }
    } else {
      // Untuk harga (Price), tetap pakai parseNumber
      cleanValue = Number(parseNumber(value));
    }

    handleChange(name, cleanValue);

    // Reset error jika ada input
    if (cleanValue !== "") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleUnitChange = (uId) => {
    const selectedUnit = units.find((u) => u.id == uId);
    handleChange("unit_id", uId);
    if (selectedUnit)
      handleChange("is_weight_based", selectedUnit.is_decimal == 1);
  };

  const calcFinal = () => {
    const price = Number(parseNumber(values.price)) || 0;

    const discount = parseFloat(values.discount_value) || 0;

    if (values.discount_type === "percentage") {
      return price - (price * discount) / 100;
    }
    if (values.discount_type === "fixed") {
      return price - discount;
    }
    return price;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting || !validate(values)) return;
    try {
      setIsSubmitting(true);
      const payload = {
        ...values,
        final_price: calcFinal(),
        is_active: values.is_active ? 1 : 0,
        is_weight_based: values.is_weight_based ? 1 : 0,
      };

      const res = initialData?.id
        ? await PackageService.updatePackage(initialData.id, payload)
        : await PackageService.createPackage(payload);

      onSuccess?.(res.data?.data);
      triggerToast(res.data?.message, "success");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } }),
    );
  };

  if (!open) return null;

  const ErrorMsg = ({ name }) => {
    if (!errors[name]) return null;
    const errorMessage =
      typeof errors[name] === "string" ? errors[name] : "Data tidak valid";
    return <p className="text-red-500 text-[10px] mt-0.5">* {errorMessage}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[460px] max-h-[90vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* HEADER: Tetap di atas */}
        <div className="p-5 pb-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
            {initialData ? "🔧 Edit Package" : "✨ New Package"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* BODY: Area yang bisa di-scroll */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-2 gap-x-3 gap-y-3"
          >
            {/* Row 1: Layanan & Kategori */}
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                Layanan
              </label>
              <select
                value={values.service_id}
                onChange={(e) => handleChange("service_id", e.target.value)}
                className={`${inputClasses({ error: !!errors.service_id })} py-1 text-[10px]`}
              >
                <option value="">Pilih...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ErrorMsg name="service_id" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                Kategori
              </label>
              <select
                value={values.category_id}
                onChange={(e) => handleChange("category_id", e.target.value)}
                className={`${inputClasses({ error: !!errors.category_id })} py-1 text-[10px]`}
              >
                <option value="">Pilih...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ErrorMsg name="category_id" />
            </div>

            {/* Row 2: Nama Paket */}
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                Nama Paket
              </label>
              <input
                value={values.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={`${inputClasses({ error: !!errors.name })} py-1 text-[10px]`}
                placeholder="Tuliskan nama Paket"
              />
              <ErrorMsg name="name" />
            </div>

            {/* Row 3: Harga Dasar & Satuan (Boxed) */}
            <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                    Harga Dasar
                  </label>
                  <input
                    type="text"
                    value={formatRupiah(values.price)}
                    onChange={(e) =>
                      handleManualChange("price", e.target.value)
                    }
                    className={`${inputClasses({ error: !!errors.price })} py-1 text-[10px] font-bold`}
                  />
                  <ErrorMsg name="price" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                    Satuan
                  </label>
                  <select
                    value={values.unit_id}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className={`${inputClasses({ error: !!errors.unit_id })} py-1 text-[10px]`}
                  >
                    <option value="">Pilih Unit...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.short_name})
                      </option>
                    ))}
                  </select>
                  <ErrorMsg name="unit_id" />
                </div>
              </div>

              {/* Row 4: Diskon */}
              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                Setting discount
              </label>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 items-start">
                <div className="flex flex-col">
                  <select
                    value={values.discount_type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      handleChange("discount_type", newType);
                      handleChange("discount_value", 0);
                      setErrors((prev) => {
                        const newErr = { ...prev };
                        delete newErr.discount_value;
                        return newErr;
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-2 h-[26px] text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="none">No Discount</option>
                    <option value="percentage">Persen (%)</option>
                    <option value="fixed">Potongan (Rp)</option>
                  </select>
                  <div className="h-3"></div>
                </div>
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={
                      values.discount_type === "percentage"
                        ? values.discount_value
                        : formatRupiah(values.discount_value)
                    }
                    onChange={(e) =>
                      handleManualChange("discount_value", e.target.value)
                    }
                    disabled={values.discount_type === "none"}
                    className={`${inputClasses({ error: !!errors.discount_value })} w-full border border-slate-200 rounded-lg px-2 h-[26px] text-[10px]`}
                    placeholder={
                      values.discount_type === "percentage" ? "0%" : "Rp 0"
                    }
                  />
                  <ErrorMsg name="discount_value" />
                </div>
              </div>
            </div>

            {/* Row 5: Durasi */}
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                Estimasi Durasi Selesai
              </label>
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <input
                    type="text"
                    value={durValue}
                    onChange={(e) => {
                      // Hanya izinkan angka, dan hapus angka 0 di depan (leading zero)
                      let val = e.target.value.replace(/[^0-9]/g, "");
                      if (val.length > 1 && val.startsWith("0")) {
                        val = val.replace(/^0+/, "");
                      }
                      setDurValue(val);
                    }}
                    className={`${inputClasses({ error: !!errors.duration_menit })} w-full px-2 h-[26px] text-[10px] `}
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 h-[26px] items-center shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={durType === "hour"}
                      onChange={() => setDurType("hour")}
                      className="w-3 h-3 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-[10px] font-bold text-slate-600">
                      Jam
                    </span>
                  </label>
                  <div className="w-[1px] h-3 bg-slate-200"></div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={durType === "day"}
                      onChange={() => setDurType("day")}
                      className="w-3 h-3 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-[10px] font-bold text-slate-600">
                      Hari
                    </span>
                  </label>
                </div>
              </div>
              <ErrorMsg name="duration_menit" />
            </div>

            {/* Row 6: Min Order & Final Price Preview */}
            <div className="col-span-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                Min. Order
              </label>
              <input
                type="text"
                value={values.min_order}
                onChange={(e) =>
                  handleManualChange("min_order", e.target.value)
                }
                className={`${inputClasses({ error: !!errors.min_order })} w-full border border-slate-200 rounded-lg px-2 h-[26px] text-[10px]`}
              />
              <ErrorMsg name="min_order" />
            </div>
            <div
              className={`col-span-1 px-3 py-2 rounded-lg flex flex-col justify-center items-end transition-colors ${values.discount_type !== "none" ? "bg-orange-500" : "bg-emerald-600"}`}
            >
              <span className="text-[7px] font-bold text-white/80 uppercase leading-none mb-1">
                {values.discount_type !== "none" ? "Harga Promo" : "Harga Nett"}
              </span>
              <span className="text-[11px] font-black text-white tabular-nums leading-none">
                {formatRupiah(calcFinal())}
              </span>
            </div>

            {/* FOOTER: Tombol Aksi */}
            <div className="col-span-2 flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-3 h-3 rounded text-emerald-600"
                />
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Aktif
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition"
                >
                  Cancel
                </button>
                <SubmitButton
                  isSubmitting={isSubmitting}
                  label={initialData ? "Update Package" : "Create Package"}
                  loadingLabel="Processing"
                  fullWidth={false}
                  className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm hover:shadow-md transition"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
