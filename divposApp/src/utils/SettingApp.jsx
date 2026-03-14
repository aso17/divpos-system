/**
 * Helper untuk mengambil nilai setting dari array appSettings
 * @param {Array} settings - State/Data appSettings dari BE
 * @param {String} key - Key setting yang dicari
 * @param {Any} defaultValue - Nilai default jika tidak ditemukan
 */
export const getAppSetting = (settings, key, defaultValue = false) => {
  if (!Array.isArray(settings) || settings.length === 0) {
    return defaultValue;
  }

  const setting = settings.find((s) => s.key === key);

  if (setting) {
    const val = setting.value;

    // Sinkronisasi tipe data Boolean/Numeric dari String BE
    if (val === true || val === "true" || val === 1 || val === "1") return true;
    if (val === false || val === "false" || val === 0 || val === "0")
      return false;

    return val;
  }

  return defaultValue;
};
