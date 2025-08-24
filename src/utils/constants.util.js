/**
 * System constants for BreakFit API
 * Centralized configuration for consistent values across the application
 */

// ===== AUTHENTICATION CONSTANTS =====
const AUTH = {
  // JWT Token settings
  ACCESS_TOKEN_TTL: process.env.JWT_ACCESS_TTL || "15m",
  REFRESH_TOKEN_TTL: process.env.JWT_REFRESH_TTL || "7d",

  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,

  // Login attempts
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes

  // Session timeout
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

// ===== FITNESS CONSTANTS =====
const FITNESS = {
  // Weight limits
  MIN_WEIGHT_KG: 30,
  MAX_WEIGHT_KG: 300,

  // Height limits
  MIN_HEIGHT_CM: 100,
  MAX_HEIGHT_CM: 250,

  // Age limits
  MIN_AGE: 13,
  MAX_AGE: 100,

  // Calorie limits
  MIN_DAILY_CALORIES: 800,
  MAX_DAILY_CALORIES: 5000,

  // Macro limits (grams)
  MIN_PROTEIN: 0,
  MAX_PROTEIN: 1000,
  MIN_CARB: 0,
  MAX_CARB: 1000,
  MIN_FAT: 0,
  MAX_FAT: 1000,

  // Workout duration limits
  MIN_WORKOUT_MINUTES: 1,
  MAX_WORKOUT_MINUTES: 480, // 8 hours

  // Activity levels
  ACTIVITY_LEVELS: {
    SEDENTARY: "sedentary",
    LIGHT: "light",
    MODERATE: "moderate",
    ACTIVE: "active",
    ATHLETE: "athlete",
  },

  // Goal types
  GOAL_TYPES: {
    WEIGHT_LOSS: "weight_loss",
    MUSCLE_GAIN: "muscle_gain",
    MAINTENANCE: "maintenance",
  },
};

// ===== GAMIFICATION CONSTANTS =====
const GAMIFICATION = {
  // XP rewards
  XP_REWARDS: {
    WEIGHT_LOGGED: 5,
    MEAL_LOGGED: 3,
    WORKOUT_COMPLETED: 10,
    PLAN_COMPLETED: 20,
    STREAK_MILESTONE: 50,
    BADGE_EARNED: 100,
    CHALLENGE_COMPLETED: 200,
  },

  // Level thresholds
  XP_PER_LEVEL: 1000,
  MAX_LEVEL: 100,

  // Streak milestones
  STREAK_MILESTONES: [3, 7, 14, 30, 60, 90, 180, 365],

  // Avatar stages
  AVATAR_STAGES: {
    LEAN_1: "lean-1",
    LEAN_2: "lean-2",
    LEAN_3: "lean-3",
    FIT_1: "fit-1",
    FIT_2: "fit-2",
    FIT_3: "fit-3",
    ATHLETE_1: "athlete-1",
    ATHLETE_2: "athlete-2",
    ATHLETE_3: "athlete-3",
  },

  // Badge rarities
  BADGE_RARITIES: {
    COMMON: "common",
    RARE: "rare",
    EPIC: "epic",
    LEGENDARY: "legendary",
  },
};

// ===== FILE UPLOAD CONSTANTS =====
const UPLOAD = {
  // File size limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB

  // Allowed image types
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],

  // Image dimensions
  MAX_IMAGE_WIDTH: 4000,
  MAX_IMAGE_HEIGHT: 4000,
  THUMBNAIL_WIDTH: 300,
  THUMBNAIL_HEIGHT: 300,

  // Upload paths
  UPLOAD_PATHS: {
    MEALS: "meals",
    WORKOUTS: "workouts",
    PROGRESS: "progress",
    PROFILE: "profile",
  },

  // Compression quality
  JPEG_QUALITY: 85,
  WEBP_QUALITY: 80,
};

// ===== API CONSTANTS =====
const API = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Rate limiting
  RATE_LIMITS: {
    GENERAL: 200, // requests per 15 minutes
    AUTH: 15, // auth attempts per 15 minutes
    UPLOAD: 30, // uploads per hour
    WEBSOCKET: 15, // connections per minute
  },

  // Response codes
  SUCCESS_CODES: [200, 201, 204],
  CLIENT_ERROR_CODES: [400, 401, 403, 404, 409, 422, 429],
  SERVER_ERROR_CODES: [500, 502, 503, 504],

  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 300000, // 5 minutes
};

// ===== NOTIFICATION CONSTANTS =====
const NOTIFICATIONS = {
  // Push notification types
  TYPES: {
    WEIGHT_REMINDER: "weight_reminder",
    WORKOUT_REMINDER: "workout_reminder",
    MEAL_REMINDER: "meal_reminder",
    STREAK_MILESTONE: "streak_milestone",
    LEVEL_UP: "level_up",
    BADGE_EARNED: "badge_earned",
    CHALLENGE_UPDATE: "challenge_update",
    SYSTEM_MAINTENANCE: "system_maintenance",
  },

  // Reminder times
  DEFAULT_REMINDER_TIME: "07:00",
  WORKOUT_REMINDER_TIME: "19:00",

  // Notification priorities
  PRIORITIES: {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    URGENT: "urgent",
  },
};

// ===== CHALLENGE CONSTANTS =====
const CHALLENGES = {
  // Challenge types
  TYPES: {
    INDIVIDUAL: "individual",
    TEAM: "team",
    GLOBAL: "global",
  },

  // Difficulty levels
  DIFFICULTIES: {
    EASY: "easy",
    MODERATE: "moderate",
    HARD: "hard",
    EXTREME: "extreme",
  },

  // Categories
  CATEGORIES: {
    WEIGHT_LOSS: "weight_loss",
    MUSCLE_GAIN: "muscle_gain",
    ENDURANCE: "endurance",
    STRENGTH: "strength",
    FLEXIBILITY: "flexibility",
    NUTRITION: "nutrition",
  },

  // Duration limits
  MIN_DURATION_DAYS: 1,
  MAX_DURATION_DAYS: 365,

  // Participant limits
  MIN_PARTICIPANTS: 1,
  MAX_PARTICIPANTS: 10000,
};

// ===== TIME CONSTANTS =====
const TIME = {
  // Time units in milliseconds
  MILLISECONDS: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000,
  },

  // Date formats
  DATE_FORMATS: {
    ISO: "YYYY-MM-DD",
    ISO_FULL: "YYYY-MM-DDTHH:mm:ss.sssZ",
    DISPLAY: "DD/MM/YYYY",
    DISPLAY_FULL: "DD/MM/YYYY HH:mm",
  },

  // Time zones
  DEFAULT_TIMEZONE: "Asia/Ho_Chi_Minh",

  // Business hours
  BUSINESS_HOURS: {
    START: "08:00",
    END: "18:00",
  },
};

// ===== ERROR CONSTANTS =====
const ERRORS = {
  // Error codes
  CODES: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    CONFLICT: "CONFLICT",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    UPLOAD_FAILED: "UPLOAD_FAILED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
  },

  // HTTP status codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
};

// ===== ENVIRONMENT CONSTANTS =====
const ENV = {
  // Environment types
  TYPES: {
    DEVELOPMENT: "development",
    STAGING: "staging",
    PRODUCTION: "production",
    TEST: "test",
  },

  // Feature flags
  FEATURES: {
    AI_ANALYSIS: process.env.ENABLE_AI_ANALYSIS === "true",
    PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === "true",
    WEBHOOKS: process.env.ENABLE_WEBHOOKS === "true",
    ANALYTICS: process.env.ENABLE_ANALYTICS === "true",
  },
};

// Export all constants
module.exports = {
  AUTH,
  FITNESS,
  GAMIFICATION,
  UPLOAD,
  API,
  NOTIFICATIONS,
  CHALLENGES,
  TIME,
  ERRORS,
  ENV,
};
