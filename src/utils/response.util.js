const { ERRORS } = require("./constants.util");

/**
 * Response utility for consistent API responses
 * Modern ES7+ style with arrow functions and destructuring
 */
const responseUtil = {
  /**
   * Success response
   */
  success(data = null, message = "Thành công", statusCode = 200) {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode,
    };
  },

  /**
   * Error response
   */
  error(
    message = "Đã xảy ra lỗi",
    code = "INTERNAL_ERROR",
    statusCode = 500,
    details = null
  ) {
    return {
      success: false,
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
      statusCode,
    };
  },

  /**
   * Validation error response
   */
  validationError(errors, message = "Dữ liệu không hợp lệ") {
    return {
      success: false,
      message,
      code: ERRORS.CODES.VALIDATION_ERROR,
      errors,
      timestamp: new Date().toISOString(),
      statusCode: 400,
    };
  },

  /**
   * Authentication error response
   */
  authError(message = "Xác thực thất bại", code = "AUTHENTICATION_ERROR") {
    return {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
      statusCode: 401,
    };
  },

  /**
   * Authorization error response
   */
  forbiddenError(
    message = "Không có quyền truy cập",
    code = "AUTHORIZATION_ERROR"
  ) {
    return {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
      statusCode: 403,
    };
  },

  /**
   * Not found error response
   */
  notFoundError(
    message = "Không tìm thấy tài nguyên",
    code = "RESOURCE_NOT_FOUND"
  ) {
    return {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
      statusCode: 404,
    };
  },

  /**
   * Conflict error response
   */
  conflictError(message = "Xung đột dữ liệu", code = "CONFLICT") {
    return {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
      statusCode: 409,
    };
  },

  /**
   * Rate limit error response
   */
  rateLimitError(message = "Quá nhiều yêu cầu", retryAfter = 60) {
    return {
      success: false,
      message,
      code: ERRORS.CODES.RATE_LIMIT_EXCEEDED,
      retryAfter,
      timestamp: new Date().toISOString(),
      statusCode: 429,
    };
  },

  /**
   * Paginated response
   */
  paginated(data, pagination, message = "Dữ liệu đã được lấy thành công") {
    return {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || 0,
        totalPages: Math.ceil(
          (pagination.total || 0) / (pagination.limit || 20)
        ),
        hasNext:
          pagination.page <
          Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
        hasPrev: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  },

  /**
   * List response
   */
  list(data, total, message = "Danh sách đã được lấy thành công") {
    return {
      success: true,
      message,
      data,
      total,
      count: Array.isArray(data) ? data.length : 0,
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  },

  /**
   * Created response
   */
  created(data, message = "Tạo thành công") {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode: 201,
    };
  },

  /**
   * Updated response
   */
  updated(data, message = "Cập nhật thành công") {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  },

  /**
   * Deleted response
   */
  deleted(message = "Xóa thành công") {
    return {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  },

  /**
   * No content response
   */
  noContent() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 204,
    };
  },

  /**
   * Health check response
   */
  health(status = "OK", details = {}) {
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      details,
    };
  },

  /**
   * WebSocket response
   */
  websocket(event, data, success = true) {
    return {
      event,
      success,
      data,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Error response for WebSocket
   */
  websocketError(event, message, code = "ERROR") {
    return {
      event,
      success: false,
      error: {
        message,
        code,
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Format error for client
   */
  formatError(error, includeStack = false) {
    const formatted = {
      message: error.message || "Đã xảy ra lỗi",
      code: error.code || "INTERNAL_ERROR",
    };

    if (includeStack && error.stack) {
      formatted.stack = error.stack;
    }

    if (error.details) {
      formatted.details = error.details;
    }

    return formatted;
  },

  /**
   * Sanitize response data (remove sensitive fields)
   */
  sanitizeData(
    data,
    sensitiveFields = ["password", "passwordHash", "token", "secret"]
  ) {
    if (!data || typeof data !== "object") return data;

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    if (Array.isArray(sanitized)) {
      return sanitized.map((item) =>
        responseUtil.sanitizeData(item, sensitiveFields)
      );
    }

    for (const field of sensitiveFields) {
      if (sanitized.hasOwnProperty(field)) {
        delete sanitized[field];
      }
    }

    for (const key in sanitized) {
      if (sanitized.hasOwnProperty(key) && typeof sanitized[key] === "object") {
        sanitized[key] = responseUtil.sanitizeData(
          sanitized[key],
          sensitiveFields
        );
      }
    }

    return sanitized;
  },
};

module.exports = responseUtil;
