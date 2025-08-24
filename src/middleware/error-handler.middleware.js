const logger = require("../utils/logger.util");

/**
 * Global error handling middleware
 * Modern ES7+ style with arrow functions and destructuring
 */
const errorHandler = {
  /**
   * Handle validation errors
   */
  handleValidationError: (error) => {
    const errors = Object.keys(error.errors || {}).map((field) => ({
      field,
      message: error.errors[field].message,
      value: error.errors[field].value,
    }));

    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu không hợp lệ",
        details: errors,
      },
    };
  },

  /**
   * Handle MongoDB duplicate key errors
   */
  handleDuplicateKeyError: (error) => {
    const [field, value] = Object.entries(error.keyValue || {})[0] || [];

    return {
      error: {
        code: "CONFLICT",
        message: `${field} '${value}' đã tồn tại`,
        details: { field, value },
      },
    };
  },

  /**
   * Handle JWT errors
   */
  handleJWTError: (error) => {
    const errorMap = {
      TokenExpiredError: { code: "TOKEN_EXPIRED", message: "Token đã hết hạn" },
      JsonWebTokenError: {
        code: "INVALID_TOKEN",
        message: "Token không hợp lệ",
      },
    };

    const { code, message } = errorMap[error.name] || {
      code: "UNAUTHORIZED",
      message: "Token không hợp lệ",
    };

    return { error: { code, message } };
  },

  /**
   * Handle file upload errors
   */
  handleFileUploadError: (error) => {
    const errorMap = {
      UNSUPPORTED_FILE_TYPE: {
        code: "UNSUPPORTED_FILE_TYPE",
        message: error.message,
      },
      FILE_TOO_LARGE: { code: "FILE_TOO_LARGE", message: error.message },
    };

    const { code, message } = errorMap[error.code] || {
      code: "UPLOAD_FAILED",
      message: "Lỗi upload file",
    };

    return { error: { code, message } };
  },

  /**
   * Main error handler middleware
   */
  handleError: (error, req, res, next) => {
    // Log error with destructuring
    const { message, stack, code } = error;
    logger.error("❌ API Error:", {
      error: message,
      stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    let errorResponse;
    let statusCode = 500;

    // Handle specific error types with switch
    switch (true) {
      case error.name === "ValidationError":
        errorResponse = errorHandler.handleValidationError(error);
        statusCode = 400;
        break;

      case error.code === 11000:
        errorResponse = errorHandler.handleDuplicateKeyError(error);
        statusCode = 409;
        break;

      case ["JsonWebTokenError", "TokenExpiredError"].includes(error.name):
        errorResponse = errorHandler.handleJWTError(error);
        statusCode = 401;
        break;

      case ["UNSUPPORTED_FILE_TYPE", "FILE_TOO_LARGE"].includes(error.code):
        errorResponse = errorHandler.handleFileUploadError(error);
        statusCode = 400;
        break;

      default:
        errorResponse = {
          error: {
            code: "INTERNAL_ERROR",
            message:
              process.env.NODE_ENV === "production"
                ? "Đã xảy ra lỗi nội bộ"
                : message,
          },
        };
        statusCode = 500;
    }

    res.status(statusCode).json(errorResponse);
  },

  /**
   * 404 handler for undefined routes
   */
  handleNotFound: (req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "API endpoint không tồn tại",
        path: req.path,
        method: req.method,
      },
    });
  },
};

module.exports = errorHandler;
