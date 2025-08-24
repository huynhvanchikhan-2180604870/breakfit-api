const crypto = require("crypto");
const moment = require("moment");
const { FITNESS, TIME } = require("./constants.util");

/**
 * Helper utility functions for common operations
 * Modern ES7+ style with arrow functions and destructuring
 */
const helpers = {
  /**
   * Generate unique ID with prefix
   */
  generateId(prefix = "id") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  },

  /**
   * Generate random string
   */
  generateRandomString(length = 8) {
    return crypto.randomBytes(length).toString("hex");
  },

  /**
   * Generate UUID v4
   */
  generateUUID() {
    return crypto.randomUUID();
  },

  /**
   * Format date to ISO string
   */
  formatDateISO(date) {
    return moment(date).format("YYYY-MM-DD");
  },

  /**
   * Format date to display format
   */
  formatDateDisplay(date, format = "DD/MM/YYYY") {
    return moment(date).format(format);
  },

  /**
   * Get date range for specified days
   */
  getDateRange(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate: helpers.formatDateISO(startDate),
      endDate: helpers.formatDateISO(endDate),
    };
  },

  /**
   * Calculate age from birth year
   */
  calculateAge(birthYear) {
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  },

  /**
   * Calculate BMI
   */
  calculateBMI(weightKg, heightCm) {
    if (heightCm <= 0) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  },

  /**
   * Get BMI category
   */
  getBMICategory(bmi) {
    if (bmi < 18.5) return "underweight";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "overweight";
    if (bmi < 35) return "obese_class_1";
    if (bmi < 40) return "obese_class_2";
    return "obese_class_3";
  },

  /**
   * Calculate weight change percentage
   */
  calculateWeightChangePercent(currentWeight, previousWeight) {
    if (previousWeight <= 0) return 0;
    return ((currentWeight - previousWeight) / previousWeight) * 100;
  },

  /**
   * Validate weight range
   */
  isValidWeight(weightKg) {
    return (
      weightKg >= FITNESS.MIN_WEIGHT_KG && weightKg <= FITNESS.MAX_WEIGHT_KG
    );
  },

  /**
   * Validate height range
   */
  isValidHeight(heightCm) {
    return (
      heightCm >= FITNESS.MIN_HEIGHT_CM && heightCm <= FITNESS.MAX_HEIGHT_CM
    );
  },

  /**
   * Validate age range
   */
  isValidAge(age) {
    return age >= FITNESS.MIN_AGE && age <= FITNESS.MAX_AGE;
  },

  /**
   * Validate calories range
   */
  isValidCalories(calories) {
    return (
      calories >= FITNESS.MIN_DAILY_CALORIES &&
      calories <= FITNESS.MAX_DAILY_CALORIES
    );
  },

  /**
   * Round number to specified decimals
   */
  roundToDecimal(number, decimals = 1) {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  /**
   * Calculate percentage
   */
  calculatePercentage(value, total) {
    if (total <= 0) return 0;
    return Math.round((value / total) * 100);
  },

  /**
   * Get file extension from filename
   */
  getFileExtension(filename) {
    return filename.split(".").pop().toLowerCase();
  },

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  },

  /**
   * Generate slug from string
   */
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  },

  /**
   * Truncate text to specified length
   */
  truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  },

  /**
   * Capitalize first letter
   */
  capitalizeFirst(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * Convert snake_case to camelCase
   */
  snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  },

  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  },

  /**
   * Deep clone object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => helpers.deepClone(item));
    if (typeof obj === "object") {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = helpers.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  },

  /**
   * Merge objects deeply
   */
  deepMerge(target, source) {
    const result = helpers.deepClone(target);

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          result[key] = helpers.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  },

  /**
   * Remove null/undefined values from object
   */
  removeNullValues(obj) {
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] != null) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  /**
   * Check if object is empty
   */
  isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === "string") return obj.length === 0;
    return Object.keys(obj).length === 0;
  },

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Retry function with exponential backoff
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (maxRetries <= 0) throw error;

      await helpers.sleep(delay);
      return helpers.retry(fn, maxRetries - 1, delay * 2);
    }
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

module.exports = helpers;
