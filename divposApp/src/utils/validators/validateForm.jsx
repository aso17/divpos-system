export const validateForm = (values, schema) => {
  const errors = {};

  for (const field in schema) {
    const value = values[field];
    const rules = schema[field];

    for (const rule of rules) {
      // Panggil rule dengan mengirimkan value saat ini dan seluruh object values
      const result = rule(value, values);

      // PERBAIKAN: Jika result bernilai true (boolean), berarti VALID.
      // Kita hanya ambil jika result adalah STRING (pesan error).
      if (result !== true && typeof result === "string") {
        errors[field] = result;
        break; // Stop di error pertama untuk field ini
      }
    }
  }

  return errors;
};
