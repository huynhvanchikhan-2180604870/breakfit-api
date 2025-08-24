const express = require("express");
const router = express.Router();

// Import controller and middleware
const planController = require("../controllers/plan.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");
const validationMiddleware = require("../middleware/validation.middleware");

/**
 * 30-day plan routes
 * POST /api/v1/plans - Create new plan
 * GET /api/v1/plans/current - Get current plan
 * PUT /api/v1/plans/:id/progress - Update plan progress
 * GET /api/v1/plans/:id/stats - Get plan statistics
 * POST /api/v1/plans/:id/complete - Complete plan
 * GET /api/v1/plans/history - Get plan history
 */

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Create new plan
router.post(
  "/",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validatePlan,
  planController.createPlan
);

// Get current plan
router.get("/current", planController.getCurrentPlan);

// Update plan progress
router.put(
  "/:id/progress",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("plan"),
  planController.updateProgress
);

// Get plan statistics
router.get(
  "/:id/stats",
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("plan"),
  planController.getPlanStats
);

// Complete plan
router.post(
  "/:id/complete",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("plan"),
  planController.completePlan
);

// Get plan history
router.get(
  "/history",
  validationMiddleware.validatePagination,
  planController.getPlanHistory
);

module.exports = router;
