const express = require("express");
const router = express.Router();

// Import controller and middleware
const weightController = require("../controllers/weight.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");
const validationMiddleware = require("../middleware/validation.middleware");

/**
 * Weight tracking routes
 * POST /api/v1/weights - Add weight entry
 * GET /api/v1/weights - Get weight entries
 * PUT /api/v1/weights/:id - Update weight entry
 * DELETE /api/v1/weights/:id - Delete weight entry
 * GET /api/v1/weights/trends - Get weight trends
 * GET /api/v1/weights/stats - Get weight statistics
 */

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Add weight entry
router.post(
  "/",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateWeightEntry,
  weightController.addWeight,
);

// Get weight entries
router.get(
  "/",
  validationMiddleware.validatePagination,
  validationMiddleware.validateDateRange,
  weightController.getWeightEntries,
);

// Update weight entry
router.put(
  "/:id",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("weight"),
  weightController.updateWeight,
);

// Delete weight entry
router.delete(
  "/:id",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("weight"),
  weightController.deleteWeight,
);

// Get weight trends
router.get(
  "/trends",
  validationMiddleware.validateDateRange,
  weightController.getWeightTrends,
);

// Get weight statistics
router.get(
  "/stats",
  validationMiddleware.validateDateRange,
  weightController.getWeightStats,
);

module.exports = router;
