const express = require("express");
const router = express.Router();

// Import controller and middleware
const aiCoachController = require("../controllers/aiCoach.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");

/**
 * AI Coach routes for personalized fitness coaching
 * POST /api/v1/ai-coach/initialize - Initialize AI Coach
 * POST /api/v1/ai-coach/sessions/start - Start coaching session
 * GET /api/v1/ai-coach/workout - Get workout recommendation
 * GET /api/v1/ai-coach/nutrition - Get nutrition advice
 * GET /api/v1/ai-coach/motivation - Get motivational content
 * POST /api/v1/ai-coach/sessions/progress - Update session progress
 * POST /api/v1/ai-coach/sessions/complete - Complete coaching session
 * POST /api/v1/ai-coach/adapt - Adapt coach based on feedback
 * GET /api/v1/ai-coach/insights - Get coach insights
 */

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply rate limiting for AI Coach endpoints - Sửa lỗi middleware undefined
router.use(rateLimitMiddleware.strictLimiter); // Thay vì aiLimiter

// Initialize AI Coach
router.post("/initialize", aiCoachController.initializeCoach);

// Start coaching session
router.post("/sessions/start", aiCoachController.startSession);

// Get personalized recommendations
router.post("/workout", aiCoachController.getWorkoutRecommendation);
router.post("/nutrition", aiCoachController.getNutritionAdvice);
router.post("/motivation", aiCoachController.getMotivationalContent);

// Session management
router.post("/sessions/progress", aiCoachController.updateSessionProgress);
router.post("/sessions/complete", aiCoachController.completeSession);

// Coach adaptation
router.post("/adapt", aiCoachController.adaptCoach);

// Get insights
router.get("/insights", aiCoachController.getCoachInsights);

module.exports = router;
