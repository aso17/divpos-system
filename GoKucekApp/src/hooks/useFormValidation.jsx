import { useState } from "react";
import { validateForm } from "../utils/validators/validateForm";

export function useFormValidation(initialValues, schema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    // HANYA update nilai, jangan panggil validateForm di sini
    setValues((prev) => ({ ...prev, [field]: value }));

    // OPTIONAL: Hapus error khusus field ini saja agar saat user
    // memperbaiki inputan, pesan error merahnya hilang.
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    // Fungsi ini HANYA dipanggil saat tombol Save ditekan
    const validationErrors = validateForm(values, schema);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  return {
    values,
    errors,
    handleChange,
    validate,
    setValues,
    setErrors, // Pastikan ini di-export untuk reset manual
  };
}
