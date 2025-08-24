const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger.util");

/**
 * Rate limiting middleware optimized for React Native
 * Prevents API abuse and ensures fair usage for mobile clients
 */
const rateLimitMiddleware = {
  /**
   * General API rate limiter (mobile optimized)
   */
  generalLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs (higher for mobile)
    message: {
      success: false,
      message: "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: 15 * 60, // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
    skipFailedRequests: false, // Count failed requests too
    handler: (req, res) => {
      logger.warn("⚠️ Rate limit exceeded (general)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: 15 * 60,
      });
    },
    // Key generator for mobile optimization
    keyGenerator: (req) => {
      // Use IP + User-Agent for better mobile identification
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),

  /**
   * Strict rate limiter for sensitive endpoints (mobile optimized)
   */
  strictLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
      success: false,
      message: "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút",
      code: "STRICT_RATE_LIMIT_EXCEEDED",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ Strict rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút",
        code: "STRICT_RATE_LIMIT_EXCEEDED",
        retryAfter: 15 * 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),

  /**
   * Authentication rate limiter (mobile optimized)
   */
  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 auth attempts per windowMs (higher for mobile)
    message: {
      success: false,
      message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false, // Count failed attempts
    handler: (req, res) => {
      logger.warn("⚠️ Auth rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút",
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        retryAfter: 15 * 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),
  // ... existing code ...

  /**
   * Friend request rate limiter (mobile optimized)
   */
  friendRequestLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 friend requests per hour
    message: {
      success: false,
      message: "Quá nhiều lời mời kết bạn. Vui lòng thử lại sau 1 giờ",
      code: "FRIEND_REQUEST_RATE_LIMIT_EXCEEDED",
      retryAfter: 60 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ Friend request rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều lời mời kết bạn. Vui lòng thử lại sau 1 giờ",
        code: "FRIEND_REQUEST_RATE_LIMIT_EXCEEDED",
        retryAfter: 60 * 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),
  // ... existing code ...

  /**
   * Post creation rate limiter (mobile optimized)
   */
  postCreationLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 posts per 15 minutes
    message: {
      success: false,
      message: "Quá nhiều bài đăng. Vui lòng thử lại sau 15 phút",
      code: "POST_CREATION_RATE_LIMIT_EXCEEDED",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ Post creation rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều bài đăng. Vui lòng thử lại sau 15 phút",
        code: "POST_CREATION_RATE_LIMIT_EXCEEDED",
        retryAfter: 15 * 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),

  // ... existing code ...
  // ... existing code ...
  /**
   * File upload rate limiter (mobile optimized)
   */
  uploadLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // Limit each IP to 30 uploads per hour (higher for mobile)
    message: {
      success: false,
      message: "Quá nhiều lần tải file. Vui lòng thử lại sau 1 giờ",
      code: "UPLOAD_RATE_LIMIT_EXCEEDED",
      retryAfter: 60 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ Upload rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều lần tải file. Vui lòng thử lại sau 1 giờ",
        code: "UPLOAD_RATE_LIMIT_EXCEEDED",
        retryAfter: 60 * 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),

  /**
   * WebSocket connection rate limiter (mobile optimized)
   */
  websocketLimiter: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // Limit each IP to 15 WebSocket connections per minute (higher for mobile)
    message: {
      success: false,
      message: "Quá nhiều kết nối WebSocket. Vui lòng thử lại sau 1 phút",
      code: "WEBSOCKET_RATE_LIMIT_EXCEEDED",
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ WebSocket rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều kết nối WebSocket. Vui lòng thử lại sau 1 phút",
        code: "WEBSOCKET_RATE_LIMIT_EXCEEDED",
        retryAfter: 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),

  /**
   * Data sync rate limiter (mobile optimized)
   */
  syncLimiter: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // Limit each IP to 50 sync requests per 5 minutes
    message: {
      success: false,
      message: "Quá nhiều yêu cầu đồng bộ. Vui lòng thử lại sau 5 phút",
      code: "SYNC_RATE_LIMIT_EXCEEDED",
      retryAfter: 5 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ Sync rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều yêu cầu đồng bộ. Vui lòng thử lại sau 5 phút",
        code: "SYNC_RATE_LIMIT_EXCEEDED",
        retryAfter: 5 * 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),
  // ... existing code ...

  /**
   * Like rate limiter (mobile optimized)
   */
  likeLimiter: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // Limit each IP to 50 likes per 5 minutes
    message: {
      success: false,
      message: "Quá nhiều lượt thích. Vui lòng thử lại sau 5 phút",
      code: "LIKE_RATE_LIMIT_EXCEEDED",
      retryAfter: 5 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ Like rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều lượt thích. Vui lòng thử lại sau 5 phút",
        code: "LIKE_RATE_LIMIT_EXCEEDED",
        retryAfter: 5 * 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),

  /**
   * Comment rate limiter (mobile optimized)
   */
  commentLimiter: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // Limit each IP to 20 comments per 10 minutes
    message: {
      success: false,
      message: "Quá nhiều bình luận. Vui lòng thử lại sau 10 phút",
      code: "COMMENT_RATE_LIMIT_EXCEEDED",
      retryAfter: 10 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ Comment rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều bình luận. Vui lòng thử lại sau 10 phút",
        code: "COMMENT_RATE_LIMIT_EXCEEDED",
        retryAfter: 10 * 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),

  // ... existing code ...
  /**
   * Notification rate limiter (mobile optimized)
   */
  notificationLimiter: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 notification requests per minute
    message: {
      success: false,
      message: "Quá nhiều yêu cầu thông báo. Vui lòng thử lại sau 1 phút",
      code: "NOTIFICATION_RATE_LIMIT_EXCEEDED",
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      logger.warn("⚠️ Notification rate limit exceeded (mobile)", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        message: "Quá nhiều yêu cầu thông báo. Vui lòng thử lại sau 1 phút",
        code: "NOTIFICATION_RATE_LIMIT_EXCEEDED",
        retryAfter: 60,
      });
    },
    keyGenerator: (req) => {
      return `${req.ip}-${
        req.get("User-Agent")?.substring(0, 50) || "unknown"
      }`;
    },
  }),
};

/**
 * Helper functions
 */

/**
 * Detect device type from User-Agent
 */
function getDeviceType(userAgent) {
  if (!userAgent) {
    return "unknown";
  }

  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    return "iOS";
  } else if (userAgent.includes("Android")) {
    return "Android";
  } else if (userAgent.includes("Mobile")) {
    return "Mobile";
  } else if (userAgent.includes("Tablet")) {
    return "Tablet";
  }

  return "Desktop";
}

module.exports = rateLimitMiddleware;
