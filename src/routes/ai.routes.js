const express = require("express");
const router = express.Router();

// Import controller and middleware
const aiController = require("../controllers/ai.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");

/**
 * AI routes for Gemini-powered features
 * POST /api/v1/ai/jobs - Create AI analysis job
 * GET /api/v1/ai/jobs/:jobId - Get job status
 * GET /api/v1/ai/jobs - Get user's jobs
 * POST /api/v1/ai/meal/analyze/:photoId - Analyze meal photo (sync)
 * POST /api/v1/ai/body/analyze/:photoId - Analyze body photo (sync)
 * POST /api/v1/ai/nutrition/recommendations - Get nutrition recommendations
 * POST /api/v1/ai/workout/recommendations - Get workout recommendations
 * POST /api/v1/ai/progress/insights - Get progress insights
 * GET /api/v1/ai/status - Get AI service status
 */

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply rate limiting for AI endpoints
router.use(rateLimitMiddleware.strictLimiter);

// AI Job Management (Async processing)
router.post("/jobs", aiController.createAnalysisJob);
router.get("/jobs/:jobId", aiController.getJobStatus);
router.get("/jobs", aiController.getUserJobs);

// Direct Analysis (Sync processing)
router.post("/meal/analyze/:photoId", aiController.analyzeMealPhoto);
router.post("/body/analyze/:photoId", aiController.analyzeBodyPhoto);

// AI Recommendations
router.post(
  "/nutrition/recommendations",
  aiController.getNutritionRecommendations
);
router.post("/workout/recommendations", aiController.getWorkoutRecommendations);
router.post("/progress/insights", aiController.getProgressInsights);

// AI Service Status
router.get("/status", aiController.getAIStatus);

module.exports = router;
