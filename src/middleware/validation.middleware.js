const { body, param, query, validationResult } = require("express-validator");
const logger = require("../utils/logger.util");

/**
 * Validation middleware for request validation
 * Provides validation functions and error handling
 */
const validationMiddleware = {
  // Export validation functions directly
  body,
  param,
  query,

  /**
   * Check validation results with mobile-friendly error format
   */
  checkValidation(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
        code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
      }));

      logger.warn("Validation failed", {
        path: req.path,
        method: req.method,
        errors: errorMessages,
        userId: req.user?._id,
      });

      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: errorMessages,
      });
    }

    next();
  },
  // Cần thêm vào validation.middleware.js:

  /**
   * Validation for weight entry
   */
  validateWeightEntry: [
    body("weightKg")
      .isFloat({ min: 30, max: 300 })
      .withMessage("Cân nặng phải từ 30-300 kg"),
    body("dateISO").isISO8601().withMessage("Ngày không hợp lệ"),
    body("note")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Ghi chú không được quá 500 ký tự"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],
  // ... existing code ...

  /**
   * Validation for MongoDB ObjectId parameter
   */
  validateId: [
    param("id").isMongoId().withMessage("ID không hợp lệ"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],
  // ... existing code ...

  /**
   * Validation for meal entry
   */
  validateMealEntry: [
    body("name")
      .isLength({ min: 1, max: 100 })
      .withMessage("Tên bữa ăn phải từ 1-100 ký tự")
      .trim(),
    body("dateISO").isISO8601().withMessage("Ngày không hợp lệ"),
    body("grams")
      .isFloat({ min: 0, max: 5000 })
      .withMessage("Khối lượng phải từ 0-5000 gram"),
    body("kcal")
      .isInt({ min: 0, max: 10000 })
      .withMessage("Calories phải từ 0-10000"),
    body("protein")
      .optional()
      .isFloat({ min: 0, max: 1000 })
      .withMessage("Protein phải từ 0-1000 gram"),
    body("carbs")
      .optional()
      .isFloat({ min: 0, max: 1000 })
      .withMessage("Carbs phải từ 0-1000 gram"),
    body("fat")
      .optional()
      .isFloat({ min: 0, max: 1000 })
      .withMessage("Fat phải từ 0-1000 gram"),
    body("note")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Ghi chú không được quá 500 ký tự"),
    body("photoIds").optional().isArray().withMessage("Photo IDs phải là mảng"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],
  // ... existing code ...

  /**
   * Validation for workout entry
   */
  validateWorkout: [
    body("dateISO").isISO8601().withMessage("Ngày không hợp lệ"),
    body("type")
      .isIn(["A", "B", "C", "cardio"])
      .withMessage("Loại workout phải là A, B, C hoặc cardio"),
    body("minutes")
      .isInt({ min: 1, max: 480 })
      .withMessage("Thời gian phải từ 1-480 phút"),
    body("kcal")
      .optional()
      .isInt({ min: 0, max: 5000 })
      .withMessage("Calories đốt cháy phải từ 0-5000"),
    body("note")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Ghi chú không được quá 500 ký tự"),
    body("photoIds").optional().isArray().withMessage("Photo IDs phải là mảng"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],

  /**
   * Validation for plan entry
   */
  validatePlan: [
    body("dayIndex")
      .isInt({ min: 0, max: 29 })
      .withMessage("Ngày trong kế hoạch phải từ 0-29"),
    body("preset")
      .isIn(["A", "B", "C"])
      .withMessage("Preset phải là A, B hoặc C"),
    body("done")
      .optional()
      .isBoolean()
      .withMessage("Trạng thái hoàn thành phải là boolean"),
    body("note")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Ghi chú không được quá 500 ký tự"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],
  // ... existing code ...

  /**
   * Validation for photo upload
   */
  validatePhotoUpload: [
    body("contextType")
      .isIn(["meal", "workout", "body"])
      .withMessage("Loại context phải là meal, workout hoặc body"),
    body("contextId")
      .optional()
      .isMongoId()
      .withMessage("Context ID không hợp lệ"),
    body("note")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Ghi chú không được quá 500 ký tự"),
    // File validation sẽ được xử lý bởi multer middleware
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }

      // Kiểm tra file upload
      if (!req.file && !req.files) {
        return res.status(400).json({
          success: false,
          message: "Không có file ảnh được upload",
          code: "PHOTO_REQUIRED",
        });
      }

      next();
    },
  ],

  // ... existing code ...

  /**
   * Validation for date range queries
   */
  validateDateRange: [
    query("from")
      .optional()
      .isISO8601()
      .withMessage("Ngày bắt đầu không hợp lệ"),
    query("to")
      .optional()
      .isISO8601()
      .withMessage("Ngày kết thúc không hợp lệ"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],
  /**
   * Custom validation for MongoDB ObjectId
   */
  isMongoId(value) {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    return mongoIdRegex.test(value);
  },

  /**
   * Custom validation for email format
   */
  isEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Custom validation for Vietnamese phone number
   */
  isVietnamesePhone(value) {
    const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(value);
  },

  /**
   * Custom validation for date format (YYYY-MM-DD)
   */
  isDateISO(value) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return false;
    }

    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },

  /**
   * Custom validation for file size (in bytes)
   */
  isFileSize(maxSize) {
    return (value) => {
      if (!value || !value.size) {
        return false;
      }
      return value.size <= maxSize;
    };
  },

  /**
   * Custom validation for file type
   */
  isFileType(allowedTypes) {
    return (value) => {
      if (!value || !value.mimetype) {
        return false;
      }
      return allowedTypes.includes(value.mimetype);
    };
  },

  /**
   * Custom validation for array length
   */
  isArrayLength(min, max) {
    return (value) => {
      if (!Array.isArray(value)) {
        return false;
      }
      return value.length >= min && value.length <= max;
    };
  },

  /**
   * Custom validation for object keys
   */
  hasRequiredKeys(requiredKeys) {
    return (value) => {
      if (typeof value !== "object" || value === null) {
        return false;
      }
      return requiredKeys.every((key) => key in value);
    };
  },

  /**
   * Custom validation for string length with Vietnamese characters
   */
  isVietnameseStringLength(min, max) {
    return (value) => {
      if (typeof value !== "string") {
        return false;
      }
      const { length } = value;
      return length >= min && length <= max;
    };
  },

  /**
   * Custom validation for Vietnamese address
   */
  isVietnameseAddress(value) {
    if (typeof value !== "string") {
      return false;
    }
    return value.length >= 10 && value.length <= 200;
  },
  /**
   * Custom validation for password strength
   */
  isStrongPassword(value) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(value);
  },

  /**
   * Custom validation for username format
   */
  isUsername(value) {
    // 3-20 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(value);
  },

  /**
   * Custom validation for URL format
   */
  isURL(value) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Custom validation for JSON string
   */
  isJSON(value) {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Custom validation for coordinate (latitude/longitude)
   */
  isCoordinate(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -180 && num <= 180;
  },

  /**
   * Custom validation for Vietnamese ID card
   */
  isVietnameseIDCard(value) {
    const idCardRegex = /^[0-9]{9,12}$/;
    return idCardRegex.test(value);
  },
  /**
   * Custom validation for workout duration (in minutes)
   */
  isWorkoutDuration(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 480; // 1 minute to 8 hours
  },

  /**
   * Custom validation for weight (in kg)
   */
  isWeight(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 30 && num <= 300; // 30kg to 300kg
  },

  /**
   * Custom validation for height (in cm)
   */
  isHeight(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 100 && num <= 250; // 100cm to 250cm
  },

  /**
   * Custom validation for age
   */
  isAge(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 13 && num <= 120; // 13 to 120 years
  },

  /**
   * Custom validation for calories
   */
  isCalories(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10000; // 0 to 10000 calories
  },

  /**
   * Custom validation for protein/carbs/fat (in grams)
   */
  isMacroNutrient(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 1000; // 0 to 1000 grams
  },

  /**
   * Custom validation for water intake (in ml)
   */
  isWaterIntake(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10000; // 0 to 10 liters
  },

  /**
   * Custom validation for sleep duration (in hours)
   */
  isSleepDuration(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 24; // 0 to 24 hours
  },

  /**
   * Custom validation for step count
   */
  isStepCount(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 100000; // 0 to 100k steps
  },

  /**
   * Custom validation for heart rate (bpm)
   */
  isHeartRate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 40 && num <= 220; // 40 to 220 bpm
  },

  /**
   * Custom validation for blood pressure (systolic/diastolic)
   */
  isBloodPressure(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 60 && num <= 200; // 60 to 200 mmHg
  },

  /**
   * Custom validation for body fat percentage
   */
  isBodyFatPercentage(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 2 && num <= 50; // 2% to 50%
  },

  /**
   * Custom validation for muscle mass (in kg)
   */
  isMuscleMass(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 10 && num <= 150; // 10kg to 150kg
  },

  /**
   * Custom validation for BMI
   */
  isBMI(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 10 && num <= 60; // 10 to 60
  },

  /**
   * Custom validation for waist circumference (in cm)
   */
  isWaistCircumference(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 50 && num <= 200; // 50cm to 200cm
  },

  /**
   * Custom validation for hip circumference (in cm)
   */
  isHipCircumference(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 60 && num <= 200; // 60cm to 200cm
  },

  /**
   * Custom validation for body measurements
   */
  isBodyMeasurement(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 10 && num <= 300; // 10cm to 300cm
  },

  /**
   * Custom validation for exercise sets
   */
  isExerciseSets(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 50; // 1 to 50 sets
  },

  /**
   * Custom validation for exercise reps
   */
  isExerciseReps(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 1000; // 1 to 1000 reps
  },

  /**
   * Custom validation for exercise weight (in kg)
   */
  isExerciseWeight(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 500; // 0 to 500kg
  },

  /**
   * Custom validation for exercise distance (in meters)
   */
  isExerciseDistance(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100000; // 0 to 100km
  },

  /**
   * Custom validation for exercise pace (minutes per km)
   */
  isExercisePace(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 2 && num <= 30; // 2 to 30 min/km
  },

  /**
   * Custom validation for exercise speed (km/h)
   */
  isExerciseSpeed(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 50; // 0 to 50 km/h
  },

  /**
   * Custom validation for exercise elevation (in meters)
   */
  isExerciseElevation(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -1000 && num <= 10000; // -1000m to 10000m
  },

  /**
   * Custom validation for exercise cadence (steps per minute)
   */
  isExerciseCadence(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 60 && num <= 200; // 60 to 200 spm
  },

  /**
   * Custom validation for exercise power (watts)
   */
  isExercisePower(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 2000; // 0 to 2000 watts
  },

  /**
   * Custom validation for exercise resistance (1-20)
   */
  isExerciseResistance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 20; // 1 to 20
  },

  /**
   * Custom validation for exercise incline (percentage)
   */
  isExerciseIncline(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -20 && num <= 30; // -20% to 30%
  },

  /**
   * Custom validation for meal portion (in grams)
   */
  isMealPortion(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 5000; // 0 to 5kg
  },

  /**
   * Custom validation for meal servings
   */
  isMealServings(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0.1 && num <= 20; // 0.1 to 20 servings
  },

  /**
   * Custom validation for meal preparation time (in minutes)
   */
  isMealPrepTime(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 480; // 0 to 8 hours
  },

  /**
   * Custom validation for meal cooking time (in minutes)
   */
  isMealCookTime(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 300; // 0 to 5 hours
  },

  /**
   * Custom validation for meal difficulty level (1-5)
   */
  isMealDifficulty(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 5; // 1 to 5
  },

  /**
   * Custom validation for meal rating (1-5)
   */
  isMealRating(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 5; // 1 to 5
  },

  /**
   * Custom validation for meal cost level (1-5)
   */
  isMealCost(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 5; // 1 to 5
  },

  /**
   * Custom validation for meal spiciness level (1-10)
   */
  isMealSpiciness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10; // 0 to 10
  },

  /**
   * Custom validation for meal sweetness level (1-10)
   */
  isMealSweetness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10; // 0 to 10
  },

  /**
   * Custom validation for meal saltiness level (1-10)
   */
  isMealSaltiness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10; // 0 to 10
  },

  /**
   * Custom validation for meal sourness level (1-10)
   */
  isMealSourness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10; // 0 to 10
  },

  /**
   * Custom validation for meal bitterness level (1-10)
   */
  isMealBitterness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10; // 0 to 10
  },

  /**
   * Custom validation for meal umami level (1-10)
   */
  isMealUmami(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10; // 0 to 10
  },

  /**
   * Custom validation for meal temperature (in Celsius)
   */
  isMealTemperature(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -20 && num <= 100; // -20°C to 100°C
  },

  /**
   * Custom validation for meal humidity (percentage)
   */
  isMealHumidity(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100; // 0% to 100%
  },

  /**
   * Custom validation for meal texture (1-10)
   */
  isMealTexture(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal aroma (1-10)
   */
  isMealAroma(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal appearance (1-10)
   */
  isMealAppearance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal satisfaction (1-10)
   */
  isMealSatisfaction(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fullness (1-10)
   */
  isMealFullness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal energy level (1-10)
   */
  isMealEnergy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal mood impact (1-10)
   */
  isMealMood(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal health impact (1-10)
   */
  isMealHealth(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal taste balance (1-10)
   */
  isMealTasteBalance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal complexity (1-10)
   */
  isMealComplexity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal creativity (1-10)
   */
  isMealCreativity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal traditionality (1-10)
   */
  isMealTraditionality(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal innovation (1-10)
   */
  isMealInnovation(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sustainability (1-10)
   */
  isMealSustainability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal accessibility (1-10)
   */
  isMealAccessibility(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal affordability (1-10)
   */
  isMealAffordability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal convenience (1-10)
   */
  isMealConvenience(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal portability (1-10)
   */
  isMealPortability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal shelf life (in days)
   */
  isMealShelfLife(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 365; // 0 to 365 days
  },

  /**
   * Custom validation for meal reheatability (1-10)
   */
  isMealReheatability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal freezability (1-10)
   */
  isMealFreezability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal batch cooking (1-10)
   */
  isMealBatchCooking(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal meal prep (1-10)
   */
  isMealMealPrep(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal leftovers (1-10)
   */
  isMealLeftovers(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sharing (1-10)
   */
  isMealSharing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal gifting (1-10)
   */
  isMealGifting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal celebration (1-10)
   */
  isMealCelebration(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal comfort (1-10)
   */
  isMealComfort(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal nostalgia (1-10)
   */
  isMealNostalgia(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal adventure (1-10)
   */
  isMealAdventure(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal discovery (1-10)
   */
  isMealDiscovery(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal learning (1-10)
   */
  isMealLearning(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal teaching (1-10)
   */
  isMealTeaching(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal mentoring (1-10)
   */
  isMealMentoring(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal coaching (1-10)
   */
  isMealCoaching(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal consulting (1-10)
   */
  isMealConsulting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal training (1-10)
   */
  isMealTraining(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal development (1-10)
   */
  isMealDevelopment(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal research (1-10)
   */
  isMealResearch(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal analysis (1-10)
   */
  isMealAnalysis(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal evaluation (1-10)
   */
  isMealEvaluation(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal assessment (1-10)
   */
  isMealAssessment(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal review (1-10)
   */
  isMealReview(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal feedback (1-10)
   */
  isMealFeedback(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal improvement (1-10)
   */
  isMealImprovement(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal optimization (1-10)
   */
  isMealOptimization(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal enhancement (1-10)
   */
  isMealEnhancement(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal refinement (1-10)
   */
  isMealRefinement(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal perfection (1-10)
   */
  isMealPerfection(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal mastery (1-10)
   */
  isMealMastery(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal expertise (1-10)
   */
  isMealExpertise(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal professionalism (1-10)
   */
  isMealProfessionalism(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal quality (1-10)
   */
  isMealQuality(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal excellence (1-10)
   */
  isMealExcellence(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal superiority (1-10)
   */
  isMealSuperiority(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal supremacy (1-10)
   */
  isMealSupremacy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal dominance (1-10)
   */
  isMealDominance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal leadership (1-10)
   */
  isMealLeadership(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal authority (1-10)
   */
  isMealAuthority(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal influence (1-10)
   */
  isMealInfluence(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal impact (1-10)
   */
  isMealImpact(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal significance (1-10)
   */
  isMealSignificance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal importance (1-10)
   */
  isMealImportance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal relevance (1-10)
   */
  isMealRelevance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal applicability (1-10)
   */
  isMealApplicability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal suitability (1-10)
   */
  isMealSuitability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal appropriateness (1-10)
   */
  isMealAppropriateness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal compatibility (1-10)
   */
  isMealCompatibility(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal consistency (1-10)
   */
  isMealConsistency(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal reliability (1-10)
   */
  isMealReliability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal dependability (1-10)
   */
  isMealDependability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal trustworthiness (1-10)
   */
  isMealTrustworthiness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal credibility (1-10)
   */
  isMealCredibility(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal authenticity (1-10)
   */
  isMealAuthenticity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal genuineness (1-10)
   */
  isMealGenuineness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal originality (1-10)
   */
  isMealOriginality(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal uniqueness (1-10)
   */
  isMealUniqueness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal distinctiveness (1-10)
   */
  isMealDistinctiveness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal individuality (1-10)
   */
  isMealIndividuality(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal personality (1-10)
   */
  isMealPersonality(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal character (1-10)
   */
  isMealCharacter(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal identity (1-10)
   */
  isMealIdentity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal essence (1-10)
   */
  isMealEssence(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal spirit (1-10)
   */
  isMealSpirit(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal soul (1-10)
   */
  isMealSoul(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal heart (1-10)
   */
  isMealHeart(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal passion (1-10)
   */
  isMealPassion(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal love (1-10)
   */
  isMealLove(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal care (1-10)
   */
  isMealCare(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal attention (1-10)
   */
  isMealAttention(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal dedication (1-10)
   */
  isMealDedication(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal commitment (1-10)
   */
  isMealCommitment(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal devotion (1-10)
   */
  isMealDevotion(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal loyalty (1-10)
   */
  isMealLoyalty(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal faithfulness (1-10)
   */
  isMealFaithfulness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal allegiance (1-10)
   */
  isMealAllegiance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fidelity (1-10)
   */
  isMealFidelity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal constancy (1-10)
   */
  isMealConstancy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal steadfastness (1-10)
   */
  isMealSteadfastness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal perseverance (1-10)
   */
  isMealPerseverance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal determination (1-10)
   */
  isMealDetermination(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal resolve (1-10)
   */
  isMealResolve(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal willpower (1-10)
   */
  isMealWillpower(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal discipline (1-10)
   */
  isMealDiscipline(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal self-control (1-10)
   */
  isMealSelfControl(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal restraint (1-10)
   */
  isMealRestraint(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal moderation (1-10)
   */
  isMealModeration(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal balance (1-10)
   */
  isMealBalance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal harmony (1-10)
   */
  isMealHarmony(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal equilibrium (1-10)
   */
  isMealEquilibrium(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal stability (1-10)
   */
  isMealStability(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal security (1-10)
   */
  isMealSecurity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal safety (1-10)
   */
  isMealSafety(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal protection (1-10)
   */
  isMealProtection(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal defense (1-10)
   */
  isMealDefense(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal shield (1-10)
   */
  isMealShield(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal armor (1-10)
   */
  isMealArmor(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal barrier (1-10)
   */
  isMealBarrier(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal wall (1-10)
   */
  isMealWall(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fortress (1-10)
   */
  isMealFortress(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal castle (1-10)
   */
  isMealCastle(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal palace (1-10)
   */
  isMealPalace(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal mansion (1-10)
   */
  isMealMansion(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal villa (1-10)
   */
  isMealVilla(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal cottage (1-10)
   */
  isMealCottage(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal cabin (1-10)
   */
  isMealCabin(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal hut (1-10)
   */
  isMealHut(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal shelter (1-10)
   */
  isMealShelter(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal refuge (1-10)
   */
  isMealRefuge(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sanctuary (1-10)
   */
  isMealSanctuary(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal haven (1-10)
   */
  isMealHaven(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal paradise (1-10)
   */
  isMealParadise(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal utopia (1-10)
   */
  isMealUtopia(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal heaven (1-10)
   */
  isMealHeaven(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal nirvana (1-10)
   */
  isMealNirvana(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal bliss (1-10)
   */
  isMealBliss(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal ecstasy (1-10)
   */
  isMealEcstasy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal euphoria (1-10)
   */
  isMealEuphoria(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal rapture (1-10)
   */
  isMealRapture(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal elation (1-10)
   */
  isMealElation(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal exhilaration (1-10)
   */
  isMealExhilaration(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal thrill (1-10)
   */
  isMealThrill(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal excitement (1-10)
   */
  isMealExcitement(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal joy (1-10)
   */
  isMealJoy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal happiness (1-10)
   */
  isMealHappiness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal contentment (1-10)
   */
  isMealContentment(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fulfillment (1-10)
   */
  isMealFulfillment(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal completion (1-10)
   */
  isMealCompletion(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal achievement (1-10)
   */
  isMealAchievement(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal success (1-10)
   */
  isMealSuccess(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal victory (1-10)
   */
  isMealVictory(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal triumph (1-10)
   */
  isMealTriumph(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal conquest (1-10)
   */
  isMealConquest(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal domination (1-10)
   */
  isMealDomination(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  isMealGreatness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal magnificence (1-10)
   */
  isMealMagnificence(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal splendor (1-10)
   */
  isMealSplendor(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal grandeur (1-10)
   */
  isMealGrandeur(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal majesty (1-10)
   */
  isMealMajesty(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal glory (1-10)
   */
  isMealGlory(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal honor (1-10)
   */
  isMealHonor(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal dignity (1-10)
   */
  isMealDignity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal respect (1-10)
   */
  isMealRespect(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal admiration (1-10)
   */
  isMealAdmiration(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal appreciation (1-10)
   */
  isMealAppreciation(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal gratitude (1-10)
   */
  isMealGratitude(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal thankfulness (1-10)
   */
  isMealThankfulness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal blessing (1-10)
   */
  isMealBlessing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal gift (1-10)
   */
  isMealGift(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal present (1-10)
   */
  isMealPresent(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal offering (1-10)
   */
  isMealOffering(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal contribution (1-10)
   */
  isMealContribution(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal donation (1-10)
   */
  isMealDonation(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal charity (1-10)
   */
  isMealCharity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal generosity (1-10)
   */
  isMealGenerosity(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal kindness (1-10)
   */
  isMealKindness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal compassion (1-10)
   */
  isMealCompassion(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal empathy (1-10)
   */
  isMealEmpathy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sympathy (1-10)
   */
  isMealSympathy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal understanding (1-10)
   */
  isMealUnderstanding(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal tolerance (1-10)
   */
  isMealTolerance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal acceptance (1-10)
   */
  isMealAcceptance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal forgiveness (1-10)
   */
  isMealForgiveness(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal mercy (1-10)
   */
  isMealMercy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal grace (1-10)
   */
  isMealGrace(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal elegance (1-10)
   */
  isMealElegance(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sophistication (1-10)
   */
  isMealSophistication(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal polish (1-10)
   */
  isMealPolish(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal finesse (1-10)
   */
  isMealFinesse(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal style (1-10)
   */
  isMealStyle(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fashion (1-10)
   */
  isMealFashion(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal trend (1-10)
   */
  isMealTrend(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal vogue (1-10)
   */
  isMealVogue(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal chic (1-10)
   */
  isMealChic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal classy (1-10)
   */
  isMealClassy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal posh (1-10)
   */
  isMealPosh(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fancy (1-10)
   */
  isMealFancy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal luxurious (1-10)
   */
  isMealLuxurious(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal premium (1-10)
   */
  isMealPremium(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal deluxe (1-10)
   */
  isMealDeluxe(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal exclusive (1-10)
   */
  isMealExclusive(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal elite (1-10)
   */
  isMealElite(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal superior (1-10)
   */
  isMealSuperior(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal exceptional (1-10)
   */
  isMealExceptional(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal outstanding (1-10)
   */
  isMealOutstanding(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal remarkable (1-10)
   */
  isMealRemarkable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal extraordinary (1-10)
   */
  isMealExtraordinary(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal phenomenal (1-10)
   */
  isMealPhenomenal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal amazing (1-10)
   */
  isMealAmazing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal incredible (1-10)
   */
  isMealIncredible(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unbelievable (1-10)
   */
  isMealUnbelievable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fantastic (1-10)
   */
  isMealFantastic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fabulous (1-10)
   */
  isMealFabulous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal marvelous (1-10)
   */
  isMealMarvelous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal wonderful (1-10)
   */
  isMealWonderful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal terrific (1-10)
   */
  isMealTerrific(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal superb (1-10)
   */
  isMealSuperb(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal brilliant (1-10)
   */
  isMealBrilliant(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal genius (1-10)
   */
  isMealGenius(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal masterful (1-10)
   */
  isMealMasterful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal skillful (1-10)
   */
  isMealSkillful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal talented (1-10)
   */
  isMealTalented(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal gifted (1-10)
   */
  isMealGifted(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal blessed (1-10)
   */
  isMealBlessed(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fortunate (1-10)
   */
  isMealFortunate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal lucky (1-10)
   */
  isMealLucky(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal charmed (1-10)
   */
  isMealCharmed(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal magical (1-10)
   */
  isMealMagical(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal mystical (1-10)
   */
  isMealMystical(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal spiritual (1-10)
   */
  isMealSpiritual(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal divine (1-10)
   */
  isMealDivine(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sacred (1-10)
   */
  isMealSacred(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal holy (1-10)
   */
  isMealHoly(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal pure (1-10)
   */
  isMealPure(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal clean (1-10)
   */
  isMealClean(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fresh (1-10)
   */
  isMealFresh(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal natural (1-10)
   */
  isMealNatural(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal organic (1-10)
   */
  isMealOrganic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal wholesome (1-10)
   */
  isMealWholesome(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal nutritious (1-10)
   */
  isMealNutritious(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal healthy (1-10)
   */
  isMealHealthy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal beneficial (1-10)
   */
  isMealBeneficial(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal advantageous (1-10)
   */
  isMealAdvantageous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal profitable (1-10)
   */
  isMealProfitable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal valuable (1-10)
   */
  isMealValuable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal precious (1-10)
   */
  isMealPrecious(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal priceless (1-10)
   */
  isMealPriceless(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal irreplaceable (1-10)
   */
  isMealIrreplaceable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unique (1-10)
   */
  isMealUnique(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal special (1-10)
   */
  isMealSpecial(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal rare (1-10)
   */
  isMealRare(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal scarce (1-10)
   */
  isMealScarce(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal limited (1-10)
   */
  isMealLimited(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal private (1-10)
   */
  isMealPrivate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal personal (1-10)
   */
  isMealPersonal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal individual (1-10)
   */
  isMealIndividual(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal particular (1-10)
   */
  isMealParticular(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal specific (1-10)
   */
  isMealSpecific(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal definite (1-10)
   */
  isMealDefinite(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal certain (1-10)
   */
  isMealCertain(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sure (1-10)
   */
  isMealSure(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal confident (1-10)
   */
  isMealConfident(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal assured (1-10)
   */
  isMealAssured(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal guaranteed (1-10)
   */
  isMealGuaranteed(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal promised (1-10)
   */
  isMealPromised(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal pledged (1-10)
   */
  isMealPledged(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sworn (1-10)
   */
  isMealSworn(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal vowed (1-10)
   */
  isMealVowed(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal committed (1-10)
   */
  isMealCommitted(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal dedicated (1-10)
   */
  isMealDedicated(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal devoted (1-10)
   */
  isMealDevoted(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal loyal (1-10)
   */
  isMealLoyal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal faithful (1-10)
   */
  isMealFaithful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal true (1-10)
   */
  isMealTrue(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal genuine (1-10)
   */
  isMealGenuine(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal authentic (1-10)
   */
  isMealAuthentic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal real (1-10)
   */
  isMealReal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal actual (1-10)
   */
  isMealActual(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal factual (1-10)
   */
  isMealFactual(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal accurate (1-10)
   */
  isMealAccurate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal precise (1-10)
   */
  isMealPrecise(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal exact (1-10)
   */
  isMealExact(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal perfect (1-10)
   */
  isMealPerfect(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal ideal (1-10)
   */
  isMealIdeal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal optimal (1-10)
   */
  isMealOptimal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal best (1-10)
   */
  isMealBest(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal greatest (1-10)
   */
  isMealGreatest(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal finest (1-10)
   */
  isMealFinest(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal top (1-10)
   */
  isMealTop(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal highest (1-10)
   */
  isMealHighest(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal maximum (1-10)
   */
  isMealMaximum(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal ultimate (1-10)
   */
  isMealUltimate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal supreme (1-10)
   */
  isMealSupreme(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal paramount (1-10)
   */
  isMealParamount(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal foremost (1-10)
   */
  isMealForemost(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal primary (1-10)
   */
  isMealPrimary(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal principal (1-10)
   */
  isMealPrincipal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal main (1-10)
   */
  isMealMain(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal central (1-10)
   */
  isMealCentral(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal core (1-10)
   */
  isMealCore(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal essential (1-10)
   */
  isMealEssential(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fundamental (1-10)
   */
  isMealFundamental(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal basic (1-10)
   */
  isMealBasic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal elementary (1-10)
   */
  isMealElementary(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal simple (1-10)
   */
  isMealSimple(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal plain (1-10)
   */
  isMealPlain(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal ordinary (1-10)
   */
  isMealOrdinary(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal common (1-10)
   */
  isMealCommon(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal regular (1-10)
   */
  isMealRegular(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal standard (1-10)
   */
  isMealStandard(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal typical (1-10)
   */
  isMealTypical(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal normal (1-10)
   */
  isMealNormal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal average (1-10)
   */
  isMealAverage(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal mediocre (1-10)
   */
  isMealMediocre(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal poor (1-10)
   */
  isMealPoor(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal bad (1-10)
   */
  isMealBad(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal terrible (1-10)
   */
  isMealTerrible(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal awful (1-10)
   */
  isMealAwful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal horrible (1-10)
   */
  isMealHorrible(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal dreadful (1-10)
   */
  isMealDreadful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal appalling (1-10)
   */
  isMealAppalling(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal shocking (1-10)
   */
  isMealShocking(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal scandalous (1-10)
   */
  isMealScandalous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal outrageous (1-10)
   */
  isMealOutrageous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal offensive (1-10)
   */
  isMealOffensive(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal insulting (1-10)
   */
  isMealInsulting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal disrespectful (1-10)
   */
  isMealDisrespectful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal rude (1-10)
   */
  isMealRude(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal impolite (1-10)
   */
  isMealImpolite(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal discourteous (1-10)
   */
  isMealDiscourteous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal uncivil (1-10)
   */
  isMealUncivil(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal ill-mannered (1-10)
   */
  isMealIllMannered(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal bad-mannered (1-10)
   */
  isMealBadMannered(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal ill-bred (1-10)
   */
  isMealIllBred(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal uncouth (1-10)
   */
  isMealUncouth(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal vulgar (1-10)
   */
  isMealVulgar(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal crude (1-10)
   */
  isMealCrude(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal coarse (1-10)
   */
  isMealCoarse(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal rough (1-10)
   */
  isMealRough(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal harsh (1-10)
   */
  isMealHarsh(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal severe (1-10)
   */
  isMealSevere(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal strict (1-10)
   */
  isMealStrict(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal rigid (1-10)
   */
  isMealRigid(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal inflexible (1-10)
   */
  isMealInflexible(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unbending (1-10)
   */
  isMealUnbending(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unyielding (1-10)
   */
  isMealUnyielding(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal stubborn (1-10)
   */
  isMealStubborn(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal obstinate (1-10)
   */
  isMealObstinate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal headstrong (1-10)
   */
  isMealHeadstrong(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal willful (1-10)
   */
  isMealWillful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal determined (1-10)
   */
  isMealDetermined(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal resolute (1-10)
   */
  isMealResolute(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal steadfast (1-10)
   */
  isMealSteadfast(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unwavering (1-10)
   */
  isMealUnwavering(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unshakable (1-10)
   */
  isMealUnshakable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal immovable (1-10)
   */
  isMealImmovable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unchangeable (1-10)
   */
  isMealUnchangeable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal immutable (1-10)
   */
  isMealImmutable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal permanent (1-10)
   */
  isMealPermanent(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal lasting (1-10)
   */
  isMealLasting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal enduring (1-10)
   */
  isMealEnduring(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal persistent (1-10)
   */
  isMealPersistent(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal continuous (1-10)
   */
  isMealContinuous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal constant (1-10)
   */
  isMealConstant(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal steady (1-10)
   */
  isMealSteady(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal stable (1-10)
   */
  isMealStable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal secure (1-10)
   */
  isMealSecure(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal safe (1-10)
   */
  isMealSafe(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal protected (1-10)
   */
  isMealProtected(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal guarded (1-10)
   */
  isMealGuarded(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal defended (1-10)
   */
  isMealDefended(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal shielded (1-10)
   */
  isMealShielded(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal armored (1-10)
   */
  isMealArmored(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fortified (1-10)
   */
  isMealFortified(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal reinforced (1-10)
   */
  isMealReinforced(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal strengthened (1-10)
   */
  isMealStrengthened(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal enhanced (1-10)
   */
  isMealEnhanced(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal improved (1-10)
   */
  isMealImproved(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal upgraded (1-10)
   */
  isMealUpgraded(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal advanced (1-10)
   */
  isMealAdvanced(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sophisticated (1-10)
   */
  isMealSophisticated(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal refined (1-10)
   */
  isMealRefined(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal polished (1-10)
   */
  isMealPolished(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal elegant (1-10)
   */
  isMealElegant(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal graceful (1-10)
   */
  isMealGraceful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal beautiful (1-10)
   */
  isMealBeautiful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal gorgeous (1-10)
   */
  isMealGorgeous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal stunning (1-10)
   */
  isMealStunning(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal breathtaking (1-10)
   */
  isMealBreathtaking(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal spectacular (1-10)
   */
  isMealSpectacular(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal magnificent (1-10)
   */
  isMealMagnificent(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal splendid (1-10)
   */
  isMealSplendid(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal glorious (1-10)
   */
  isMealGlorious(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal majestic (1-10)
   */
  isMealMajestic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal regal (1-10)
   */
  isMealRegal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal royal (1-10)
   */
  isMealRoyal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal noble (1-10)
   */
  isMealNoble(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal aristocratic (1-10)
   */
  isMealAristocratic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal prestigious (1-10)
   */
  isMealPrestigious(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal distinguished (1-10)
   */
  isMealDistinguished(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal eminent (1-10)
   */
  isMealEminent(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal prominent (1-10)
   */
  isMealProminent(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal notable (1-10)
   */
  isMealNotable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal routine (1-10)
   */
  isMealRoutine(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal habitual (1-10)
   */
  isMealHabitual(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal customary (1-10)
   */
  isMealCustomary(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal traditional (1-10)
   */
  isMealTraditional(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal conventional (1-10)
   */
  isMealConventional(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal orthodox (1-10)
   */
  isMealOrthodox(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal conservative (1-10)
   */
  isMealConservative(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal moderate (1-10)
   */
  isMealModerate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal balanced (1-10)
   */
  isMealBalanced(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal reasonable (1-10)
   */
  isMealReasonable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sensible (1-10)
   */
  isMealSensible(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal practical (1-10)
   */
  isMealPractical(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal realistic (1-10)
   */
  isMealRealistic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal logical (1-10)
   */
  isMealLogical(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal rational (1-10)
   */
  isMealRational(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal intelligent (1-10)
   */
  isMealIntelligent(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal smart (1-10)
   */
  isMealSmart(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal clever (1-10)
   */
  isMealClever(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal wise (1-10)
   */
  isMealWise(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal knowledgeable (1-10)
   */
  isMealKnowledgeable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal educated (1-10)
   */
  isMealEducated(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal learned (1-10)
   */
  isMealLearned(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal scholarly (1-10)
   */
  isMealScholarly(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal academic (1-10)
   */
  isMealAcademic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal professional (1-10)
   */
  isMealProfessional(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal expert (1-10)
   */
  isMealExpert(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal specialist (1-10)
   */
  isMealSpecialist(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal master (1-10)
   */
  isMealMaster(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal veteran (1-10)
   */
  isMealVeteran(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal experienced (1-10)
   */
  isMealExperienced(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal seasoned (1-10)
   */
  isMealSeasoned(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal mature (1-10)
   */
  isMealMature(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal grown (1-10)
   */
  isMealGrown(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal developed (1-10)
   */
  isMealDeveloped(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal progressive (1-10)
   */
  isMealProgressive(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal innovative (1-10)
   */
  isMealInnovative(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal creative (1-10)
   */
  isMealCreative(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal imaginative (1-10)
   */
  isMealImaginative(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal artistic (1-10)
   */
  isMealArtistic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal expressive (1-10)
   */
  isMealExpressive(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal emotional (1-10)
   */
  isMealEmotional(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal passionate (1-10)
   */
  isMealPassionate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal enthusiastic (1-10)
   */
  isMealEnthusiastic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal energetic (1-10)
   */
  isMealEnergetic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal dynamic (1-10)
   */
  isMealDynamic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal active (1-10)
   */
  isMealActive(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal lively (1-10)
   */
  isMealLively(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal vibrant (1-10)
   */
  isMealVibrant(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal colorful (1-10)
   */
  isMealColorful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal bright (1-10)
   */
  isMealBright(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal cheerful (1-10)
   */
  isMealCheerful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal happy (1-10)
   */
  isMealHappy(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal joyful (1-10)
   */
  isMealJoyful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal delightful (1-10)
   */
  isMealDelightful(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal pleasant (1-10)
   */
  isMealPleasant(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal enjoyable (1-10)
   */
  isMealEnjoyable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal satisfying (1-10)
   */
  isMealSatisfying(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fulfilling (1-10)
   */
  isMealFulfilling(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal rewarding (1-10)
   */
  isMealRewarding(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal gratifying (1-10)
   */
  isMealGratifying(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal pleasing (1-10)
   */
  isMealPleasing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal agreeable (1-10)
   */
  isMealAgreeable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal acceptable (1-10)
   */
  isMealAcceptable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal suitable (1-10)
   */
  isMealSuitable(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal appropriate (1-10)
   */
  isMealAppropriate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fitting (1-10)
   */
  isMealFitting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal proper (1-10)
   */
  isMealProper(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal correct (1-10)
   */
  isMealCorrect(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal right (1-10)
   */
  isMealRight(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal good (1-10)
   */
  isMealGood(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fine (1-10)
   */
  isMealFine(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal nice (1-10)
   */
  isMealNice(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal okay (1-10)
   */
  isMealOkay(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal alright (1-10)
   */
  isMealAlright(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal decent (1-10)
   */
  isMealDecent(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fair (1-10)
   */
  isMealFair(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal adequate (1-10)
   */
  isMealAdequate(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal sufficient (1-10)
   */
  isMealSufficient(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal enough (1-10)
   */
  isMealEnough(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal complete (1-10)
   */
  isMealComplete(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal full (1-10)
   */
  isMealFull(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal whole (1-10)
   */
  isMealWhole(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal entire (1-10)
   */
  isMealEntire(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal total (1-10)
   */
  isMealTotal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal comprehensive (1-10)
   */
  isMealComprehensive(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal thorough (1-10)
   */
  isMealThorough(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal detailed (1-10)
   */
  isMealDetailed(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal extensive (1-10)
   */
  isMealExtensive(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal broad (1-10)
   */
  isMealBroad(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal wide (1-10)
   */
  isMealWide(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal vast (1-10)
   */
  isMealVast(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal huge (1-10)
   */
  isMealHuge(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal enormous (1-10)
   */
  isMealEnormous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal massive (1-10)
   */
  isMealMassive(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal gigantic (1-10)
   */
  isMealGigantic(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal colossal (1-10)
   */
  isMealColossal(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal tremendous (1-10)
   */
  isMealTremendous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal astonishing (1-10)
   */
  isMealAstonishing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal astounding (1-10)
   */
  isMealAstounding(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal surprising (1-10)
   */
  isMealSurprising(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unexpected (1-10)
   */
  isMealUnexpected(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal unusual (1-10)
   */
  isMealUnusual(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal strange (1-10)
   */
  isMealStrange(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal odd (1-10)
   */
  isMealOdd(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal peculiar (1-10)
   */
  isMealPeculiar(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal curious (1-10)
   */
  isMealCurious(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal interesting (1-10)
   */
  isMealInteresting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal fascinating (1-10)
   */
  isMealFascinating(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal captivating (1-10)
   */
  isMealCaptivating(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal engaging (1-10)
   */
  isMealEngaging(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal entertaining (1-10)
   */
  isMealEntertaining(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal amusing (1-10)
   */
  isMealAmusing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal funny (1-10)
   */
  isMealFunny(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal humorous (1-10)
   */
  isMealHumorous(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal witty (1-10)
   */
  isMealWitty(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal inscribing (1-10)
   */
  isMealInscribing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal marking (1-10)
   */
  isMealMarking(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal labeling (1-10)
   */
  isMealLabeling(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal tagging (1-10)
   */
  isMealTagging(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal stamping (1-10)
   */
  isMealStamping(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal imprinting (1-10)
   */
  isMealImprinting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal embossing (1-10)
   */
  isMealEmbossing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal debossing (1-10)
   */
  isMealDebossing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal indenting (1-10)
   */
  isMealIndenting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal denting (1-10)
   */
  isMealDenting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal dimpling (1-10)
   */
  isMealDimpling(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal pitting (1-10)
   */
  isMealPitting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal cratering (1-10)
   */
  isMealCratering(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal hollowing (1-10)
   */
  isMealHollowing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal excavating (1-10)
   */
  isMealExcavating(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal digging (1-10)
   */
  isMealDigging(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal burrowing (1-10)
   */
  isMealBurrowing(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal tunneling (1-10)
   */
  isMealTunneling(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal boring (1-10)
   */
  isMealBoring(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal hosting (1-10)
   */
  isMealHosting(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal accommodating (1-10)
   */
  isMealAccommodating(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal lodging (1-10)
   */
  isMealLodging(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Custom validation for meal quartering (1-10)
   */
  isMealQuartering(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10; // 1 to 10
  },

  /**
   * Validation for user registration
   */
  validateUserRegistration: [
    body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Mật khẩu phải chứa chữ hoa, chữ thường và số"),
    body("fullName")
      .isLength({ min: 2, max: 50 })
      .withMessage("Họ tên phải từ 2-50 ký tự")
      .trim(),
    body("phone")
      .optional()
      .custom((value) => {
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
        return phoneRegex.test(value);
      })
      .withMessage("Số điện thoại không hợp lệ"),
    body("dateOfBirth")
      .optional()
      .custom((value) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          return false;
        }
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
      })
      .withMessage("Ngày sinh không hợp lệ"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Giới tính không hợp lệ"),
    body("height")
      .optional()
      .isFloat({ min: 100, max: 250 })
      .withMessage("Chiều cao phải từ 100-250 cm"),
    body("weight")
      .optional()
      .isFloat({ min: 30, max: 300 })
      .withMessage("Cân nặng phải từ 30-300 kg"),
    body("activityLevel")
      .optional()
      .isIn([
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extremely_active",
      ])
      .withMessage("Mức độ hoạt động không hợp lệ"),
    body("goal")
      .optional()
      .isIn(["lose_weight", "maintain_weight", "gain_weight"])
      .withMessage("Mục tiêu không hợp lệ"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],

  /**
   * Validation for user login
   */
  validateUserLogin: [
    body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
    body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],

  /**
   * Validation for change password
   */
  validateChangePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Mật khẩu hiện tại không được để trống"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Mật khẩu mới phải chứa chữ hoa, chữ thường và số"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],

  /**
   * Validation for request password reset
   */
  validateRequestReset: [
    body("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],

  /**
   * Validation for reset password
   */
  validateResetPassword: [
    body("token").notEmpty().withMessage("Token không được để trống"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Mật khẩu mới phải chứa chữ hoa, chữ thường và số"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],

  /**
   * Validation for pagination parameters
   */
  validatePagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Trang phải là số nguyên dương"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Giới hạn phải từ 1-100"),
    query("cursor").optional().isString().withMessage("Cursor không hợp lệ"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],

  /**
   * Validation for user profile update
   */
  validateProfileUpdate: [
    body("fullName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Họ tên phải từ 2-50 ký tự")
      .trim(),
    body("phone")
      .optional()
      .custom((value) => {
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
        return phoneRegex.test(value);
      })
      .withMessage("Số điện thoại không hợp lệ"),
    body("dateOfBirth")
      .optional()
      .custom((value) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          return false;
        }
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
      })
      .withMessage("Ngày sinh không hợp lệ"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Giới tính không hợp lệ"),
    body("height")
      .optional()
      .isFloat({ min: 100, max: 250 })
      .withMessage("Chiều cao phải từ 100-250 cm"),
    body("weight")
      .optional()
      .isFloat({ min: 30, max: 300 })
      .withMessage("Cân nặng phải từ 30-300 kg"),
    body("activityLevel")
      .optional()
      .isIn([
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extremely_active",
      ])
      .withMessage("Mức độ hoạt động không hợp lệ"),
    body("goal")
      .optional()
      .isIn(["lose_weight", "maintain_weight", "gain_weight"])
      .withMessage("Mục tiêu không hợp lệ"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],

  /**
   * Validation for user preferences update
   */
  validatePreferencesUpdate: [
    body("notifications")
      .optional()
      .isObject()
      .withMessage("Cài đặt thông báo không hợp lệ"),
    body("privacy")
      .optional()
      .isObject()
      .withMessage("Cài đặt riêng tư không hợp lệ"),
    body("units")
      .optional()
      .isIn(["metric", "imperial"])
      .withMessage("Đơn vị không hợp lệ"),
    body("language")
      .optional()
      .isIn(["vi", "en"])
      .withMessage("Ngôn ngữ không hợp lệ"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
          code: `VALIDATION_${error.path.toUpperCase()}_${error.type.toUpperCase()}`,
        }));
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: errorMessages,
        });
      }
      next();
    },
  ],
};

module.exports = validationMiddleware;
