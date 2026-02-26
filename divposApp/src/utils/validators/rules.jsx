export const rules = {
  required: (value, message = "This field is required") => {
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

  noHtml: (
    value,
    message = "Karakter < > tidak diizinkan untuk alasan keamanan",
  ) => {
    if (!value) return null;
    // Regex mendeteksi keberadaan tag <...>
    const regex = /<[^>]*>/;
    if (regex.test(value)) {
      return message;
    }
    return null;
  },

  safeString: (value, message = "Input mengandung karakter yang dilarang") => {
    if (!value) return null;
    // Melarang karakter yang sering dipakai SQL Injection seperti: ; -- ' "
    const forbidden = /[;'"\-\-]/;
    if (forbidden.test(value)) {
      return message;
    }
    return null;
  },
  email: (value, message = "Invalid email format") => {
    if (!value) return null;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  minLength: (value, length, message) => {
    if (!value || value.length < length) {
      return message || `Minimum ${length} characters`;
    }
    return null;
  },

  /**
   * ❌ No letters allowed (only numbers & symbols)
   */
  noLetters: (value, message = "Letters are not allowed") => {
    if (!value) return null;

    const regex = /^[^a-zA-Z]+$/;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * Password must contain:
   * - Uppercase
   * - Lowercase
   * - Number
   * - Special character
   */
  strongPassword: (
    value,
    minLength = 8,
    message = "Password must contain uppercase, lowercase, number, and special character",
  ) => {
    if (!value) return message;

    const regex = new RegExp(
      `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{${minLength},}$`,
    );

    if (!regex.test(value)) {
      return message;
    }

    return null;
  },

  /**
   * 📎 File must be image
   */
  fileType: (
    file,
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    message,
  ) => {
    if (!file) return null;

    if (!allowedTypes.includes(file.type)) {
      return (
        message ||
        `File must be one of: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`
      );
    }

    return null;
  },

  /**
   * 📏 File size max (bytes)
   */
  fileSize: (file, maxSize, message) => {
    if (!file) return null;

    if (file.size > maxSize) {
      return (
        message ||
        `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    return null;
  },

  /**
   * 🔤 Only alphanumeric + dot + underscore (for username)
   */
  username: (
    value,
    message = "Username may only contain letters, numbers, . and _",
  ) => {
    if (!value) return null;

    const regex = /^[a-zA-Z0-9._]+$/;
    if (!regex.test(value)) {
      return message;
    }

    return null;
  },

  /**
   * 📱 Indonesian phone number (08 / 628)
   */
  phoneID: (
    value,
    message = "Phone must start with 08 or 628 and contain 10–14 digits",
  ) => {
    if (!value) return null;

    const regex = /^(08|628)[0-9]{8,12}$/;
    if (!regex.test(value)) {
      return message;
    }

    return null;
  },
};
