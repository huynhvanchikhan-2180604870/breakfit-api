const { FITNESS, TIME } = require("./constants.util");

/**
 * Validation utility functions for data validation
 * Modern ES7+ style with arrow functions and destructuring
 */
const validators = {
  /**
   * Validate email format
   */
  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   */
  isValidPassword(password) {
    if (!password || typeof password !== "string") return false;

    // Minimum 8 characters, at least one uppercase, one lowercase, one number
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Validate phone number (Vietnamese format)
   */
  isValidPhone(phone) {
    if (!phone || typeof phone !== "string") return false;

    // Vietnamese phone number format
    const phoneRegex =
      /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate Vietnamese ID card
   */
  isValidVietnamID(id) {
    if (!id || typeof id !== "string") return false;

    // Vietnamese ID card format (12 digits)
    const idRegex = /^[0-9]{12}$/;
    return idRegex.test(id);
  },

  /**
   * Validate weight value
   */
  isValidWeight(weight) {
    if (typeof weight !== "number" || isNaN(weight)) return false;
    return weight >= FITNESS.MIN_WEIGHT_KG && weight <= FITNESS.MAX_WEIGHT_KG;
  },

  /**
   * Validate height value
   */
  isValidHeight(height) {
    if (typeof height !== "number" || isNaN(height)) return false;
    return height >= FITNESS.MIN_HEIGHT_CM && height <= FITNESS.MAX_HEIGHT_CM;
  },

  /**
   * Validate age value
   */
  isValidAge(age) {
    if (typeof age !== "number" || isNaN(age)) return false;
    return age >= FITNESS.MIN_AGE && age <= FITNESS.MAX_AGE;
  },

  /**
   * Validate calories value
   */
  isValidCalories(calories) {
    if (typeof calories !== "number" || isNaN(calories)) return false;
    return (
      calories >= FITNESS.MIN_DAILY_CALORIES &&
      calories <= FITNESS.MAX_DAILY_CALORIES
    );
  },

  /**
   * Validate macro nutrients
   */
  isValidMacro(value, macroType) {
    if (typeof value !== "number" || isNaN(value)) return false;

    const limits = {
      protein: { min: FITNESS.MIN_PROTEIN, max: FITNESS.MAX_PROTEIN },
      carb: { min: FITNESS.MIN_CARB, max: FITNESS.MAX_CARB },
      fat: { min: FITNESS.MIN_FAT, max: FITNESS.MAX_FAT },
    };

    const limit = limits[macroType];
    if (!limit) return false;

    return value >= limit.min && value <= limit.max;
  },

  /**
   * Validate workout duration
   */
  isValidWorkoutDuration(minutes) {
    if (typeof minutes !== "number" || isNaN(minutes)) return false;
    return (
      minutes >= FITNESS.MIN_WORKOUT_MINUTES &&
      minutes <= FITNESS.MAX_WORKOUT_MINUTES
    );
  },

  /**
   * Validate date format (ISO 8601)
   */
  isValidDate(date) {
    if (!date || typeof date !== "string") return false;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  },

  /**
   * Validate date range
   */
  isValidDateRange(startDate, endDate) {
    if (
      !validators.isValidDate(startDate) ||
      !validators.isValidDate(endDate)
    ) {
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return start <= end;
  },

  /**
   * Validate time format (HH:MM)
   */
  isValidTime(time) {
    if (!time || typeof time !== "string") return false;

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  /**
   * Validate URL format
   */
  isValidURL(url) {
    if (!url || typeof url !== "string") return false;

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate MongoDB ObjectId
   */
  isValidObjectId(id) {
    if (!id || typeof id !== "string") return false;

    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  },

  /**
   * Validate UUID format
   */
  isValidUUID(uuid) {
    if (!uuid || typeof uuid !== "string") return false;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validate file extension
   */
  isValidFileExtension(filename, allowedExtensions) {
    if (!filename || !Array.isArray(allowedExtensions)) return false;

    const extension = filename.split(".").pop().toLowerCase();
    return allowedExtensions.includes(extension);
  },

  /**
   * Validate file size
   */
  isValidFileSize(size, maxSize) {
    if (typeof size !== "number" || typeof maxSize !== "number") return false;
    return size > 0 && size <= maxSize;
  },

  /**
   * Validate image dimensions
   */
  isValidImageDimensions(width, height, maxWidth, maxHeight) {
    if (typeof width !== "number" || typeof height !== "number") return false;
    if (typeof maxWidth !== "number" || typeof maxHeight !== "number")
      return false;

    return width > 0 && height > 0 && width <= maxWidth && height <= maxHeight;
  },

  /**
   * Validate pagination parameters
   */
  isValidPagination(page, limit, maxLimit = 100) {
    if (typeof page !== "number" || typeof limit !== "number") return false;
    return page > 0 && limit > 0 && limit <= maxLimit;
  },

  /**
   * Validate enum value
   */
  isValidEnum(value, allowedValues) {
    if (!Array.isArray(allowedValues)) return false;
    return allowedValues.includes(value);
  },

  /**
   * Validate array length
   */
  isValidArrayLength(array, minLength = 0, maxLength = Infinity) {
    if (!Array.isArray(array)) return false;
    return array.length >= minLength && array.length <= maxLength;
  },

  /**
   * Validate string length
   */
  isValidStringLength(str, minLength = 0, maxLength = Infinity) {
    if (typeof str !== "string") return false;
    return str.length >= minLength && str.length <= maxLength;
  },

  /**
   * Validate numeric range
   */
  isValidNumericRange(value, min, max) {
    if (typeof value !== "number" || isNaN(value)) return false;
    if (typeof min !== "number" || typeof max !== "number") return false;
    return value >= min && value <= max;
  },

  /**
   * Validate required fields
   */
  validateRequiredFields(data, requiredFields) {
    if (!data || typeof data !== "object") return false;
    if (!Array.isArray(requiredFields)) return false;

    const missingFields = requiredFields.filter((field) => {
      const value = data[field];
      return value === undefined || value === null || value === "";
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  },

  /**
   * Validate data against schema
   */
  validateSchema(data, schema) {
    if (!data || typeof data !== "object") return false;
    if (!schema || typeof schema !== "object") return false;

    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Check required
      if (
        rules.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push({
          field,
          message: `${field} là bắt buộc`,
          code: "REQUIRED_FIELD",
        });
        continue;
      }

      // Skip validation if field is not required and value is empty
      if (
        !rules.required &&
        (value === undefined || value === null || value === "")
      ) {
        continue;
      }

      // Check type
      if (rules.type && typeof value !== rules.type) {
        errors.push({
          field,
          message: `${field} phải có kiểu dữ liệu ${rules.type}`,
          code: "INVALID_TYPE",
        });
        continue;
      }

      // Check length
      if (
        rules.minLength &&
        validators.isValidStringLength(value, rules.minLength)
      ) {
        errors.push({
          field,
          message: `${field} phải có ít nhất ${rules.minLength} ký tự`,
          code: "MIN_LENGTH",
        });
      }

      if (
        rules.maxLength &&
        validators.isValidStringLength(value, 0, rules.maxLength)
      ) {
        errors.push({
          field,
          message: `${field} không được quá ${rules.maxLength} ký tự`,
          code: "MAX_LENGTH",
        });
      }

      // Check range
      if (rules.min !== undefined && rules.max !== undefined) {
        if (!validators.isValidNumericRange(value, rules.min, rules.max)) {
          errors.push({
            field,
            message: `${field} phải từ ${rules.min} đến ${rules.max}`,
            code: "OUT_OF_RANGE",
          });
        }
      }

      // Check enum
      if (rules.enum && !validators.isValidEnum(value, rules.enum)) {
        errors.push({
          field,
          message: `${field} phải là một trong các giá trị: ${rules.enum.join(
            ", "
          )}`,
          code: "INVALID_ENUM",
        });
      }

      // Check custom validation
      if (rules.custom && typeof rules.custom === "function") {
        try {
          const customResult = rules.custom(value, data);
          if (customResult !== true) {
            errors.push({
              field,
              message: customResult || `${field} không hợp lệ`,
              code: "CUSTOM_VALIDATION",
            });
          }
        } catch (error) {
          errors.push({
            field,
            message: `Lỗi validation cho ${field}`,
            code: "VALIDATION_ERROR",
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

module.exports = validators;
