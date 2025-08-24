const express = require("express");
const router = express.Router();

// Import controller and middleware
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");
const validationMiddleware = require("../middleware/validation.middleware");

/**
 * Authentication routes
 * POST /api/v1/auth/register - User registration
 * POST /api/v1/auth/login - User login
 * POST /api/v1/auth/refresh - Refresh access token
 * POST /api/v1/auth/logout - User logout
 * POST /api/v1/auth/change-password - Change password
 * POST /api/v1/auth/request-reset - Request password reset
 * POST /api/v1/auth/reset-password - Reset password with token
 * GET /api/v1/auth/me - Get current user info
 */

// User registration
router.post(
  "/register",
  rateLimitMiddleware.authLimiter,
  validationMiddleware.validateUserRegistration,
  authController.register
);

// User login
router.post(
  "/login",
  rateLimitMiddleware.authLimiter,
  validationMiddleware.validateUserLogin,
  authController.login
);

// Refresh access token
router.post(
  "/refresh",
  rateLimitMiddleware.authLimiter,
  authController.refreshToken
);

// User logout
router.post("/logout", authMiddleware.verifyToken, authController.logout);

// Change password
router.post(
  "/change-password",
  authMiddleware.verifyToken,
  rateLimitMiddleware.strictLimiter,
  validationMiddleware.validateChangePassword,
  authController.changePassword
);

// Request password reset
router.post(
  "/request-reset",
  rateLimitMiddleware.authLimiter,
  validationMiddleware.validateRequestReset,
  authController.requestPasswordReset
);

// Reset password with token
router.post(
  "/reset-password",
  rateLimitMiddleware.authLimiter,
  validationMiddleware.validateResetPassword,
  authController.resetPassword
);

// Get current user info
router.get("/me", authMiddleware.verifyToken, authController.getCurrentUser);

module.exports = router;
