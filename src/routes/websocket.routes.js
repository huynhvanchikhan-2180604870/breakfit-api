const express = require("express");
const router = express.Router();

// Import controller and middleware
const websocketController = require("../controllers/websocket.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");

/**
 * WebSocket management routes
 * GET /api/v1/websocket/stats - Get WebSocket statistics
 * GET /api/v1/websocket/online-count - Get online users count
 */

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Get WebSocket statistics
router.get("/stats", websocketController.getWebSocketStats);

// Get online users count
router.get("/online-count", websocketController.getOnlineUsersCount);

module.exports = router;
