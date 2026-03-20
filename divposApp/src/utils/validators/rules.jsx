export const rules = {
  /**
   * ✅ Wajib diisi
   */
  required: (value, message = "Field ini wajib diisi") => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return message;
    }
    return null;
  },

  /**
   * 🛡️ Anti-XSS: Melarang tag HTML atau karakter kurung siku
   */
  noHtml: (value, message = "Karakter < > tidak diizinkan") => {
    if (!value) return null;
    // Deteksi tag lengkap maupun karakter siku tunggal
    const regex = /[<>]/;
    if (regex.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * 🛡️ Anti-SQL Injection: Melarang karakter berbahaya
   */
  safeString: (
    value,
    message = "Input mengandung karakter yang dilarang (; ' \" --)"
  ) => {
    if (!value) return null;
    // Melarang karakter ; ' " dan double dash -- yang sering dipakai SQLi
    const forbidden = /[;'"\-\-]/;
    if (forbidden.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * 📧 Email: Dengan Auto-Trim (Menangani spasi tidak sengaja)
   */
  email: (value, message = "Format email tidak valid") => {
    if (!value) return null;

    // Lakukan trim di sini agar spasi di awal/akhir tidak merusak validasi
    const cleanEmail = typeof value === "string" ? value.trim() : value;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!regex.test(cleanEmail)) {
      return message;
    }
    return null;
  },

  /**
   * 📏 Panjang Minimum
   */
  minLength: (value, length, message) => {
    if (!value || value.length < length) {
      return message || `Minimal ${length} karakter`;
    }
    return null;
  },

  maxLength: (value, length, message) => {
    if (value && value.length > length) {
      return message || `Maksimal ${length} karakter`;
    }
    return null;
  },
  /**
   * ❌ No Letters: Hanya angka dan simbol (Cocok untuk input numerik murni)
   */
  noLetters: (value, message = "Karakter huruf tidak diizinkan") => {
    if (!value) return null;
    const regex = /^[^a-zA-Z]+$/;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * 🔐 Password Kuat: Besar, kecil, angka, simbol
   */
  strongPassword: (
    value,
    minLength = 8,
    message = "Password harus mengandung huruf besar, kecil, angka, dan karakter spesial"
  ) => {
    if (!value) return null;
    const regex = new RegExp(
      `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{${minLength},}$`
    );
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * 📎 Validasi Tipe File
   */
  fileType: (
    file,
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    message
  ) => {
    if (!file) return null;
    if (!allowedTypes.includes(file.type)) {
      return (
        message ||
        `Format file harus: ${allowedTypes
          .map((t) => t.split("/")[1])
          .join(", ")}`
      );
    }
    return null;
  },

  /**
   * 📏 Ukuran File Maksimal
   */
  fileSize: (file, maxSize, message) => {
    if (!file) return null;
    if (file.size > maxSize) {
      return (
        message || `Ukuran file maksimal ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }
    return null;
  },

  /**
   * 🔤 Username: Alfanumerik, titik, dan underscore
   */
  username: (
    value,
    message = "Username hanya boleh huruf, angka, titik, dan underscore"
  ) => {
    if (!value) return null;
    const regex = /^[a-zA-Z0-9._]+$/;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * 📱 Indonesian Phone: 08 atau 628 (Anti-Spasi & Anti-Strip)
   */
  phoneID: (
    value,
    message = "Nomor harus diawali 08 atau 628 (10-14 digit)"
  ) => {
    if (!value) return null;
    // Bersihkan karakter non-angka dulu (seperti spasi atau -) sebelum dicek regex
    const cleanPhone = String(value).replace(/\D/g, "");
    const regex = /^(08|628)[0-9]{8,12}$/;
    if (!regex.test(cleanPhone)) {
      return message;
    }
    return null;
  },
};
