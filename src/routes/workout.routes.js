const express = require("express");
const router = express.Router();

// Import controller and middleware
const workoutController = require("../controllers/workout.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");
const validationMiddleware = require("../middleware/validation.middleware");

/**
 * Workout tracking routes
 * POST /api/v1/workouts/start - Start workout session
 * POST /api/v1/workouts/:id/end - End workout session
 * POST /api/v1/workouts/:id/exercises - Add exercise to workout
 * GET /api/v1/workouts - Get workout entries
 * GET /api/v1/workouts/:id - Get workout by ID
 * PUT /api/v1/workouts/:id - Update workout
 * DELETE /api/v1/workouts/:id - Delete workout
 * GET /api/v1/workouts/stats - Get workout statistics
 * GET /api/v1/workouts/trends - Get workout trends
 */

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Start workout session
router.post(
  "/start",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateWorkout,
  workoutController.startWorkout
);

// End workout session
router.post(
  "/:id/end",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("workout"),
  workoutController.endWorkout
);

// Add exercise to workout
router.post(
  "/:id/exercises",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("workout"),
  workoutController.addExercise
);

// Get workout entries
router.get(
  "/",
  validationMiddleware.validatePagination,
  validationMiddleware.validateDateRange,
  workoutController.getWorkoutEntries
);

// Get workout by ID
router.get(
  "/:id",
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("workout"),
  workoutController.getWorkout
);

// Update workout
router.put(
  "/:id",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("workout"),
  workoutController.updateWorkout
);

// Delete workout
router.delete(
  "/:id",
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateId,
  authMiddleware.requireOwnership("workout"),
  workoutController.deleteWorkout
);

// Get workout statistics
router.get(
  "/stats",
  validationMiddleware.validateDateRange,
  workoutController.getWorkoutStats
);

// Get workout trends
router.get(
  "/trends",
  validationMiddleware.validateDateRange,
  workoutController.getWorkoutTrends
);

module.exports = router;
