const express = require("express");
const router = express.Router();

// Import controller and middleware
const mealController = require("../controllers/meal.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");
const validationMiddleware = require("../middleware/validation.middleware");

/**
 * Meal tracking routes
 * POST /api/v1/meals - Add meal entry
 * GET /api/v1/meals - Get meal entries
 * PUT /api/v1/meals/:id - Update meal entry
 * DELETE /api/v1/meals/:id - Delete meal entry
 * GET /api/v1/meals/nutrition - Get nutrition summary
 * GET /api/v1/meals/stats - Get meal statistics
 */

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Add meal entry
router.post(
  "/",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateMealEntry,
  mealController.addMeal
);

// Get meal entries
router.get(
  "/",
  validationMiddleware.validatePagination,
  validationMiddleware.validateDateRange,
  mealController.getMealEntries
);

// Update meal entry
router.put(
  "/:id",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("meal"),
  mealController.updateMeal
);

// Delete meal entry
router.delete(
  "/:id",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("meal"),
  mealController.deleteMeal
);

// Get nutrition summary
router.get(
  "/nutrition",
  validationMiddleware.validateDateRange,
  mealController.getNutritionSummary
);

// Get meal statistics
router.get(
  "/stats",
  validationMiddleware.validateDateRange,
  mealController.getMealStats
);

module.exports = router;
