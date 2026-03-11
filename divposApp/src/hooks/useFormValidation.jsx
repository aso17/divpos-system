import { useState, useCallback } from "react";
import { validateForm } from "../utils/validators/validateForm";

export function useFormValidation(initialValues, schema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    // Hapus error secara real-time saat user mulai mengetik/memperbaiki
    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const validate = (manualValues = null) => {
    // Jika ada data yang dikirim manual (e.g. values terbaru), gunakan itu.
    // Jika tidak, gunakan state values saat ini.
    const dataToValidate = manualValues || values;
    const validationErrors = validateForm(dataToValidate, schema);

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
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
