const express = require("express");
const router = express.Router();

// Import all route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const weightRoutes = require("./weight.routes");
const mealRoutes = require("./meal.routes");
const workoutRoutes = require("./workout.routes");
const planRoutes = require("./plan.routes");
const photoRoutes = require("./photo.routes");
const gamificationRoutes = require("./gamification.routes");
const websocketRoutes = require("./websocket.routes");
const aiRoutes = require("./ai.routes");
const socialRoutes = require("./social.routes");
const challengesRoutes = require("./challenges.route");
const battleRoutes = require("./battle.routes");
const aiCoachRoutes = require("./aiCoach.routes");
const socialFeedRoutes = require("./socialFeed.routes");
const integrationRoutes = require("./integration.routes");

/**
 * Main API routes configuration
 * All routes are prefixed with /api/v1
 */

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BreakFit API đang hoạt động",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API status route
router.get("/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Status",
    services: {
      database: "connected",
      websocket: "ready",
      ai: "available",
      social: "active",
    },
    uptime: process.uptime(),
  });
});

// Mount all route modules
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/weights", weightRoutes);
router.use("/meals", mealRoutes);
router.use("/workouts", workoutRoutes);
router.use("/plans", planRoutes);
router.use("/photos", photoRoutes);
router.use("/gamification", gamificationRoutes);
router.use("/websocket", websocketRoutes);
router.use("/ai", aiRoutes);
router.use("/social", socialRoutes);
router.use("/challenges", challengesRoutes); 
router.use("/battles", battleRoutes);
router.use("/ai-coach", aiCoachRoutes);
router.use("/social-feed", socialFeedRoutes);
router.use("/integrations", integrationRoutes);


module.exports = router;
