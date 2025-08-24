const express = require("express");
const router = express.Router();

// Import controller and middleware
const battleController = require("../controllers/battle.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");

/**
 * Battle routes for 1-1 battles
 * POST /api/v1/battles - Create new battle
 * GET /api/v1/battles - Get battles with filtering
 * GET /api/v1/battles/:id - Get battle by ID
 * POST /api/v1/battles/:id/accept - Accept battle
 * POST /api/v1/battles/:id/baseline - Set baseline measurement
 * POST /api/v1/battles/:id/progress - Update battle progress
 * POST /api/v1/battles/:id/updates - Add battle update
 * GET /api/v1/battles/user/me - Get user's battles
 * GET /api/v1/battles/stats/me - Get user's battle stats
 */

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply rate limiting for battle endpoints
router.use(rateLimitMiddleware.strictLimiter);

// Create new battle
router.post("/", battleController.createBattle);

// Get battles with filtering
router.get("/", battleController.getBattles);

// Get battle by ID
router.get("/:battleId", battleController.getBattle);

// Accept battle
router.post("/:battleId/accept", battleController.acceptBattle);

// Set battle baseline
router.post("/:battleId/baseline", battleController.setBaseline);

// Update battle progress
router.post("/:battleId/progress", battleController.updateProgress);

// Add battle update
router.post("/:battleId/updates", battleController.addUpdate);

// Get user's battles
router.get("/user/me", battleController.getUserBattles);

// Get user's battle stats
router.get("/stats/me", battleController.getBattleStats);

module.exports = router;
