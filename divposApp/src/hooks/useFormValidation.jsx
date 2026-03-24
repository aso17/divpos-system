import { useState, useCallback } from "react";
import { validateForm } from "../utils/validators/validateForm";

export function useFormValidation(initialValues, schema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // MODIFIKASI DI SINI: Tambahkan parameter targetFields
  const validate = (targetFields = null) => {
    // 1. Ambil semua error dari seluruh schema dulu
    const allValidationErrors = validateForm(values, schema);

    // 2. Jika user memberikan targetFields (e.g. ['name', 'address'])
    if (targetFields && Array.isArray(targetFields)) {
      const filteredErrors = {};

      targetFields.forEach((field) => {
        if (allValidationErrors[field]) {
          filteredErrors[field] = allValidationErrors[field];
        }
      });

      // Update errors hanya untuk field yang ditarget (tanpa menghapus error field lain yang mungkin sudah ada)
      setErrors((prev) => ({
        ...prev,
        ...filteredErrors,
      }));

      // Return true jika tidak ada error di field yang ditarget
      return Object.keys(filteredErrors).length === 0;
    }

    // 3. Jika tidak ada targetFields, validasi normal (semua)
    setErrors(allValidationErrors);
    return Object.keys(allValidationErrors).length === 0;
  };

  return {
    values,
    errors,
    handleChange,
    validate,
    setValues,
    setErrors,
  };
}
