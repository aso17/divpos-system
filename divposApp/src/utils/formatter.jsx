export const formatRupiah = (value) => {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

export const parseNumber = (value) => {
  return value.replace(/\./g, "");
};
