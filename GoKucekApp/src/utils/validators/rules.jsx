export const rules = {
  required: (value, message = "This field is required") => {
    if (!value || value.trim() === "") {
      return message;
    }
    return null;
  },

  email: (value, message = "Invalid email format") => {
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
};
