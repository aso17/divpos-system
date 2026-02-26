// utils/validators/inputClasses.js
export const inputClasses = ({
  error = false,
  disabled = false,
  extra = "",
} = {}) => {
  return `
        mt-1 w-full rounded-xl border px-4 py-3 outline-none
        transition-all duration-200
        ${
          error
            ? "border-red-500 focus:ring-1 focus:ring-red-500"
            : // GANTI DI SINI: blue-500 jadi emerald-600 atau emerald-500
              "border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        }
        ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-gray-50 focus:bg-white"}
        ${extra}
    `;
};
