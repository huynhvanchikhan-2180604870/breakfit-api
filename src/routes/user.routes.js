const express = require("express");
const router = express.Router();

// Import controller and middleware
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");
const validationMiddleware = require("../middleware/validation.middleware");

/**
 * User profile routes
 * GET /api/v1/users/profile - Get user profile
 * PUT /api/v1/users/profile - Update user profile
 * GET /api/v1/users/stats - Get user statistics
 * PUT /api/v1/users/preferences - Update user preferences
 * DELETE /api/v1/users/account - Delete user account
 */

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Get user profile
router.get("/profile", userController.getProfile);

// Update user profile
router.put(
  "/profile",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateProfileUpdate,
  userController.updateProfile,
);

// Get user statistics
router.get(
  "/stats",
  validationMiddleware.validatePagination,
  userController.getUserStats
);

// Update user preferences
router.put(
  "/preferences",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validatePreferencesUpdate,
  userController.updatePreferences,
);

// Delete user account
router.delete(
  "/account",
  rateLimitMiddleware.strictLimiter,
  userController.deleteAccount,
);

module.exports = router;
