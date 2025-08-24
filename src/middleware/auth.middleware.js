const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const logger = require("../utils/logger.util");

/**
 * Authentication middleware optimized for React Native
 * Handles JWT tokens, refresh tokens, and mobile-specific auth
 */
const authMiddleware = {
  /**
   * Verify JWT access token
   */
  async verifyToken(req, res, next) {
    try {
      // Get token from header (React Native sends as Bearer token)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Token xác thực không được cung cấp",
          code: "AUTH_TOKEN_MISSING",
        });
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists and is active
        const user = await User.findById(decoded.userId)
          .select("-passwordHash")
          .lean(); // Use lean() for better performance

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Người dùng không tồn tại",
            code: "USER_NOT_FOUND",
          });
        }

        if (!user.isActive) {
          return res.status(401).json({
            success: false,
            message: "Tài khoản đã bị khóa",
            code: "ACCOUNT_LOCKED",
          });
        }

        // Add user to request object
        req.user = user;
        next();
      } catch (jwtError) {
        if (jwtError.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token đã hết hạn. Vui lòng đăng nhập lại",
            code: "TOKEN_EXPIRED",
            shouldRefresh: true,
          });
        }

        if (jwtError.name === "JsonWebTokenError") {
          return res.status(401).json({
            success: false,
            message: "Token không hợp lệ",
            code: "INVALID_TOKEN",
          });
        }

        throw jwtError;
      }
    } catch (error) {
      logger.error("❌ Token verification failed", {
        error: error.message,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(500).json({
        success: false,
        message: "Xác thực token thất bại. Vui lòng thử lại sau",
        code: "AUTH_ERROR",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Optional token verification (for public routes with optional auth)
   */
  async optionalToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(); // Continue without user
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
          .select("-passwordHash")
          .lean();

        if (user && user.isActive) {
          req.user = user;
        }

        next();
      } catch (jwtError) {
        // Continue without user if token is invalid
        next();
      }
    } catch (error) {
      logger.error("❌ Optional token verification failed", {
        error: error.message,
        ip: req.ip,
      });

      // Continue without user
      next();
    }
  },

  /**
   * Check if user has specific role
   */
  requireRole(role) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Yêu cầu xác thực",
          code: "AUTH_REQUIRED",
        });
      }

      if (req.user.role !== role) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
          code: "INSUFFICIENT_PERMISSIONS",
        });
      }

      next();
    };
  },

  /**
   * Check if user is admin
   */
  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Yêu cầu xác thực",
        code: "AUTH_REQUIRED",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ admin mới có quyền truy cập",
        code: "ADMIN_REQUIRED",
      });
    }

    next();
  },

  /**
   * Check if user owns the resource (optimized for mobile)
   */
  requireOwnership(modelName) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Yêu cầu xác thực",
            code: "AUTH_REQUIRED",
          });
        }

        const resourceId = req.params.id || req.params[`${modelName}Id`];
        if (!resourceId) {
          return res.status(400).json({
            success: false,
            message: "ID tài nguyên không được cung cấp",
            code: "RESOURCE_ID_MISSING",
          });
        }

        // Check if resource belongs to user (use lean for performance)
        const resource = await require(`../models/${modelName}.model`)
          .findById(resourceId)
          .lean();

        if (!resource) {
          return res.status(404).json({
            success: false,
            message: "Tài nguyên không tồn tại",
            code: "RESOURCE_NOT_FOUND",
          });
        }

        if (resource.userId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Bạn không có quyền truy cập tài nguyên này",
            code: "ACCESS_DENIED",
          });
        }

        req.resource = resource;
        next();
      } catch (error) {
        logger.error("❌ Ownership check failed", {
          error: error.message,
          userId: req.user?._id,
          modelName,
          resourceId: req.params.id || req.params[`${modelName}Id`],
        });

        res.status(500).json({
          success: false,
          message: "Kiểm tra quyền sở hữu thất bại. Vui lòng thử lại sau",
          code: "OWNERSHIP_CHECK_ERROR",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    };
  },
};

module.exports = authMiddleware;
