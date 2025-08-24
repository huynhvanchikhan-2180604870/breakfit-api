const express = require("express");
const router = express.Router();

// Import controller and middleware
const socialFeedController = require("../controllers/socialFeed.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");

/**
 * Social Feed routes for social media and community features
 * POST /api/v1/social-feed - Create new post
 * GET /api/v1/social-feed - Get personalized feed
 * GET /api/v1/social-feed/user/me - Get user's posts
 * GET /api/v1/social-feed/trending - Get trending posts
 * POST /api/v1/social-feed/:postId/like - Like/unlike post
 * POST /api/v1/social-feed/:postId/comments - Add comment
 * POST /api/v1/social-feed/:postId/comments/:commentIndex/replies - Add reply
 * POST /api/v1/social-feed/:postId/share - Share post
 * GET /api/v1/social-feed/search - Search posts
 * GET /api/v1/social-feed/hashtags/suggestions - Get hashtag suggestions
 * POST /api/v1/social-feed/:postId/report - Report post
 * GET /api/v1/social-feed/:postId/stats - Get post statistics
 * POST /api/v1/social-feed/:postId/view - View post
 */

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply rate limiting for social feed endpoints - Sửa lỗi middleware undefined
router.use(rateLimitMiddleware.strictLimiter); // Thay vì socialLimiter

// Create new post
router.post("/", socialFeedController.createPost);

// Get personalized feed
router.get("/", socialFeedController.getFeed);

// Get user's posts
router.get("/user/me", socialFeedController.getUserPosts);

// Get trending posts
router.get("/trending", socialFeedController.getTrendingPosts);

// Search posts
router.get("/search", socialFeedController.searchPosts);

// Get hashtag suggestions
router.get("/hashtags/suggestions", socialFeedController.getHashtagSuggestions);

// Post interactions
router.post("/:postId/like", socialFeedController.toggleLike);
router.post("/:postId/comments", socialFeedController.addComment);
router.post(
  "/:postId/comments/:commentIndex/replies",
  socialFeedController.addReply
);
router.post("/:postId/share", socialFeedController.sharePost);
router.post("/:postId/report", socialFeedController.reportPost);
router.post("/:postId/view", socialFeedController.viewPost);

// Get post statistics
router.get("/:postId/stats", socialFeedController.getPostStats);

module.exports = router;
