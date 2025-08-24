const express = require("express");
const router = express.Router();

// Import controller and middleware
const gamificationController = require("../controllers/gamification.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");

/**
 * Gamification routes for XP, levels, achievements, and rewards
 * GET /api/v1/gamification/profile - Get user gamification profile
 * POST /api/v1/gamification/xp - Award XP to user
 * POST /api/v1/gamification/streak - Update user streak
 * POST /api/v1/gamification/achievements - Unlock achievement
 * POST /api/v1/gamification/challenges/daily - Add daily challenge
 * POST /api/v1/gamification/challenges/progress - Update challenge progress
 * POST /api/v1/gamification/quests - Add quest to user
 * POST /api/v1/gamification/quests/progress - Update quest progress
 * POST /api/v1/gamification/coins/award - Award coins to user
 * POST /api/v1/gamification/coins/spend - Spend coins from user
 * POST /api/v1/gamification/stats - Update user statistics
 * POST /api/v1/gamification/records - Add record for user
 * GET /api/v1/gamification/achievements - Get user achievements
 * GET /api/v1/gamification/challenges - Get user challenges
 * GET /api/v1/gamification/quests - Get user quests
 * GET /api/v1/gamification/leaderboard - Get leaderboard
 * GET /api/v1/gamification/achievers - Get top achievers
 */

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply rate limiting for gamification endpoints
router.use(rateLimitMiddleware.strictLimiter);

// Get user gamification profile
router.get("/profile", gamificationController.getUserProfile);

// XP and progression
router.post("/xp", gamificationController.awardXP);
router.post("/streak", gamificationController.updateStreak);

// Achievements and badges
router.post("/achievements", gamificationController.unlockAchievement);
router.get("/achievements", gamificationController.getUserAchievements);

// Challenges
router.post("/challenges/daily", gamificationController.addDailyChallenge);
router.post(
  "/challenges/progress",
  gamificationController.updateChallengeProgress
);
router.get("/challenges", gamificationController.getUserChallenges);

// Quests
router.post("/quests", gamificationController.addQuest);
router.post("/quests/progress", gamificationController.updateQuestProgress);
router.get("/quests", gamificationController.getUserQuests);

// Virtual currency
router.post("/coins/award", gamificationController.awardCoins);
router.post("/coins/spend", gamificationController.spendCoins);

// Statistics and records
router.post("/stats", gamificationController.updateStats);
router.post("/records", gamificationController.addRecord);

// Leaderboards and rankings
router.get("/leaderboard", gamificationController.getLeaderboard);
router.get("/achievers", gamificationController.getTopAchievers);

module.exports = router;
