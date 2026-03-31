export const STATUS_PENDING = "PENDING";
export const STATUS_PROCESS = "PROCESS";
export const STATUS_READY = "READY";
export const STATUS_TAKEN = "TAKEN";
export const STATUS_CANCELED = "CANCELED";
export const STATUS_COMPLETED = "COMPLETED";

export const TX_STATUS_MAP = {
  [STATUS_PENDING]: {
    label: "Pending",
    cls: "bg-amber-50  text-amber-600  border-amber-200",
  },
  [STATUS_PROCESS]: {
    label: "Proses",
    cls: "bg-blue-50   text-blue-600   border-blue-200",
  },
  [STATUS_READY]: {
    label: "Siap",
    cls: "bg-purple-50 text-purple-600 border-purple-200",
  },
  [STATUS_TAKEN]: {
    label: "Diambil",
    cls: "bg-gray-50   text-gray-600   border-gray-200",
  },
  [STATUS_CANCELED]: {
    label: "Batal",
    cls: "bg-red-50    text-red-600    border-red-200",
  },
  [STATUS_COMPLETED]: {
    label: "Selesai",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

// Helper: boleh dibatalkan jika belum PAID dan status masih PENDING/PROCESS
export const canCancel = (trx) =>
  trx.payment_status !== "PAID" &&
  [STATUS_PENDING, STATUS_PROCESS].includes(trx.status);

// Helper: apakah ada data employee di halaman ini
export const hasEmployeeData = (data) =>
  data.some((trx) => trx.details?.some((d) => d.employee_name));
