const express = require("express");
const router = express.Router();

// Import controller and middleware
const challengeController = require("../controllers/challenge.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");

/**
 * Challenge routes for fitness challenges
 * POST /api/v1/challenges - Create new challenge
 * GET /api/v1/challenges - Get challenges with filtering
 * GET /api/v1/challenges/:id - Get challenge by ID
 * POST /api/v1/challenges/:id/join - Join challenge
 * POST /api/v1/challenges/:id/leave - Leave challenge
 * GET /api/v1/challenges/:id/leaderboard - Get challenge leaderboard
 * GET /api/v1/challenges/user/me - Get user's challenges
 * POST /api/v1/challenges/:id/progress - Update challenge progress
 */

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply rate limiting for challenge endpoints
router.use(rateLimitMiddleware.strictLimiter);

// Create new challenge
router.post("/", challengeController.createChallenge);

// Get challenges with filtering
router.get("/", challengeController.getChallenges);

// Get challenge by ID
router.get("/:challengeId", challengeController.getChallenge);

// Join challenge
router.post("/:challengeId/join", challengeController.joinChallenge);

// Leave challenge
router.post("/:challengeId/leave", challengeController.leaveChallenge);

// Get challenge leaderboard
router.get("/:challengeId/leaderboard", challengeController.getLeaderboard);

// Get user's challenges
router.get("/user/me", challengeController.getUserChallenges);

// Update challenge progress
router.post("/:challengeId/progress", challengeController.updateProgress);

module.exports = router;
