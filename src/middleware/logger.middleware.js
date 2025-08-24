const logger = require("../utils/logger.util");

/**
 * Logging middleware optimized for React Native backend
 * Tracks API requests, responses, and mobile-specific metrics
 */
const loggerMiddleware = {
  /**
   * Request logging with mobile optimization
   */
  logRequest(req, res, next) {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Add request ID to request object
    req.requestId = requestId;

    // Log incoming request with mobile context
    logger.info("�� Incoming request", {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?._id || "anonymous",
      deviceType: getDeviceType(req.get("User-Agent")),
      appVersion: req.get("X-App-Version"),
      platform: req.get("X-Platform"), // iOS/Android
      timestamp: new Date().toISOString(),
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      const duration = Date.now() - startTime;

      // Log response with mobile metrics
      logger.info("�� Response sent", {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?._id || "anonymous",
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });

      // Log slow requests for mobile optimization
      if (duration > 2000) {
        // Log requests >2 seconds
        logger.warn("🐌 Slow request detected (mobile)", {
          requestId,
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          ip: req.ip,
          userId: req.user?._id || "anonymous",
          deviceType: getDeviceType(req.get("User-Agent")),
          platform: req.get("X-Platform"),
        });
      }

      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };

    next();
  },

  /**
   * Error logging with mobile context
   */
  logError(error, req, res, next) {
    logger.error("❌ Request error (mobile)", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userId: req.user?._id || "anonymous",
      deviceType: getDeviceType(req.get("User-Agent")),
      platform: req.get("X-Platform"),
      appVersion: req.get("X-App-Version"),
      timestamp: new Date().toISOString(),
    });

    next(error);
  },

  /**
   * Performance monitoring for mobile
   */
  logPerformance(req, res, next) {
    const startTime = process.hrtime.bigint();

    res.on("finish", () => {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds

      // Log performance metrics for mobile optimization
      if (duration > 1000) {
        // Log requests >1 second
        logger.warn("🐌 Performance warning (mobile)", {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          duration: `${duration.toFixed(2)}ms`,
          ip: req.ip,
          userId: req.user?._id || "anonymous",
          deviceType: getDeviceType(req.get("User-Agent")),
          platform: req.get("X-Platform"),
        });
      }

      // Log very fast responses for optimization tracking
      if (duration < 100) {
        logger.info("⚡ Fast response (mobile)", {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          duration: `${duration.toFixed(2)}ms`,
          ip: req.ip,
          userId: req.user?._id || "anonymous",
          deviceType: getDeviceType(req.get("User-Agent")),
          platform: req.get("X-Platform"),
        });
      }
    });

    next();
  },

  /**
   * Mobile-specific metrics logging
   */
  logMobileMetrics(req, res, next) {
    // Log mobile-specific headers and data
    const mobileHeaders = {
      "X-App-Version": req.get("X-App-Version"),
      "X-Platform": req.get("X-Platform"),
      "X-Device-Model": req.get("X-Device-Model"),
      "X-OS-Version": req.get("X-OS-Version"),
      "X-Screen-Resolution": req.get("X-Screen-Resolution"),
      "X-Network-Type": req.get("X-Network-Type"), // WiFi, 4G, 5G
    };

    // Only log if mobile headers are present
    const hasMobileHeaders = Object.values(mobileHeaders).some(
      (header) => header
    );

    if (hasMobileHeaders) {
      logger.info("📱 Mobile request detected", {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        mobileHeaders,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  },

  /**
   * API usage analytics for mobile
   */
  logApiUsage(req, res, next) {
    // Track API endpoint usage for mobile optimization
    const endpoint = `${req.method} ${req.path}`;

    // Log popular endpoints
    const popularEndpoints = [
      "GET /api/v1/weights",
      "POST /api/v1/weights",
      "GET /api/v1/meals",
      "POST /api/v1/meals",
      "GET /api/v1/workouts",
      "POST /api/v1/workouts",
      "GET /api/v1/plans",
      "GET /api/v1/photos",
      "POST /api/v1/photos",
    ];

    if (popularEndpoints.includes(endpoint)) {
      logger.info("📊 Popular endpoint accessed", {
        requestId: req.requestId,
        endpoint,
        userId: req.user?._id || "anonymous",
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });
    }

    next();
  },

  /**
   * File upload logging for mobile
   */
  logFileUpload(req, res, next) {
    if (req.file || req.files) {
      const fileInfo = req.file || req.files[0];

      logger.info("📁 File upload (mobile)", {
        requestId: req.requestId,
        path: req.path,
        fileName: fileInfo?.originalname,
        fileSize: fileInfo?.size,
        mimeType: fileInfo?.mimetype,
        userId: req.user?._id || "anonymous",
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });
    }

    next();
  },

  /**
   * WebSocket connection logging for mobile
   */
  logWebSocketConnection(req, res, next) {
    // Check if this is a WebSocket upgrade request
    if (req.headers.upgrade === "websocket") {
      logger.info("🔌 WebSocket connection (mobile)", {
        requestId: req.requestId,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        deviceType: getDeviceType(req.get("User-Agent")),
        platform: req.get("X-Platform"),
        timestamp: new Date().toISOString(),
      });
    }

    next();
  },
};

/**
 * Helper functions
 */

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detect device type from User-Agent
 */
function getDeviceType(userAgent) {
  if (!userAgent) return "unknown";

  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    return "iOS";
  } else if (userAgent.includes("Android")) {
    return "Android";
  } else if (userAgent.includes("Mobile")) {
    return "Mobile";
  } else if (userAgent.includes("Tablet")) {
    return "Tablet";
  } else {
    return "Desktop";
  }
}

module.exports = loggerMiddleware;
