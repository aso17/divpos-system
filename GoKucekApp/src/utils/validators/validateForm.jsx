export const validateForm = (values, schema) => {
  const errors = {};

  for (const field in schema) {
    const value = values[field];
    const rules = schema[field];

    for (const rule of rules) {
      // PERBAIKAN: Tambahkan 'values' sebagai argumen kedua
      const error = rule(value, values);

      if (error) {
        errors[field] = error;
        break;
      }
    }
  }

  return errors;
};
