const express = require("express");
const router = express.Router();

// Import controller and middleware
const socialController = require("../controllers/social.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");
const validationMiddleware = require("../middleware/validation.middleware");

/**
 * Social routes for friend management and social interactions
 * POST /api/v1/social/friends/request - Send friend request
 * POST /api/v1/social/friends/accept/:requestId - Accept friend request
 * GET /api/v1/social/friends - Get friends list
 * POST /api/v1/social/posts - Create post
 * GET /api/v1/social/feed - Get social feed
 * POST /api/v1/social/posts/:postId/like - Like/unlike post
 * POST /api/v1/social/posts/:postId/comments - Add comment
 * GET /api/v1/social/users/:targetUserId/posts - Get user posts
 * DELETE /api/v1/social/posts/:postId - Delete post
 */

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Friend management routes
router.post(
  "/friends/request",
  rateLimitMiddleware.friendRequestLimiter,
  [
    validationMiddleware
      .body("recipientId")
      .isMongoId()
      .withMessage("ID người nhận không hợp lệ"),
    validationMiddleware
      .body("message")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Tin nhắn không được quá 200 ký tự"),
  ],
  validationMiddleware.checkValidation,
  socialController.sendFriendRequest
);

router.post(
  "/friends/accept/:requestId",
  rateLimitMiddleware.generalLimiter,
  [
    validationMiddleware
      .param("requestId")
      .isMongoId()
      .withMessage("ID lời mời không hợp lệ"),
  ],
  validationMiddleware.checkValidation,
  socialController.acceptFriendRequest
);

router.get(
  "/friends",
  rateLimitMiddleware.generalLimiter,
  [
    validationMiddleware
      .query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Trang phải là số nguyên dương"),
    validationMiddleware
      .query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Giới hạn phải từ 1-100"),
  ],
  validationMiddleware.checkValidation,
  socialController.getFriendsList
);

// Post management routes
router.post(
  "/posts",
  rateLimitMiddleware.postCreationLimiter,
  [
    validationMiddleware
      .body("type")
      .isIn([
        "achievement",
        "workout",
        "meal",
        "progress",
        "milestone",
        "general",
      ])
      .withMessage("Loại bài viết không hợp lệ"),
    validationMiddleware
      .body("title")
      .isLength({ min: 1, max: 200 })
      .withMessage("Tiêu đề phải từ 1-200 ký tự"),
    validationMiddleware
      .body("content")
      .isLength({ min: 1, max: 2000 })
      .withMessage("Nội dung phải từ 1-2000 ký tự"),
    validationMiddleware
      .body("privacy")
      .optional()
      .isIn(["public", "friends", "private"])
      .withMessage("Quyền riêng tư không hợp lệ"),
    validationMiddleware
      .body("tags")
      .optional()
      .isArray()
      .withMessage("Tags phải là mảng"),
    validationMiddleware
      .body("media")
      .optional()
      .isArray()
      .withMessage("Media phải là mảng"),
  ],
  validationMiddleware.checkValidation,
  socialController.createPost
);

router.get(
  "/feed",
  rateLimitMiddleware.generalLimiter,
  [
    validationMiddleware
      .query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Trang phải là số nguyên dương"),
    validationMiddleware
      .query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Giới hạn phải từ 1-50"),
  ],
  validationMiddleware.checkValidation,
  socialController.getSocialFeed
);

router.post(
  "/posts/:postId/like",
  rateLimitMiddleware.likeLimiter,
  [
    validationMiddleware
      .param("postId")
      .isMongoId()
      .withMessage("ID bài viết không hợp lệ"),
  ],
  validationMiddleware.checkValidation,
  socialController.togglePostLike
);

router.post(
  "/posts/:postId/comments",
  rateLimitMiddleware.commentLimiter,
  [
    validationMiddleware
      .param("postId")
      .isMongoId()
      .withMessage("ID bài viết không hợp lệ"),
    validationMiddleware
      .body("content")
      .isLength({ min: 1, max: 500 })
      .withMessage("Nội dung bình luận phải từ 1-500 ký tự"),
  ],
  validationMiddleware.checkValidation,
  socialController.addComment
);

router.get(
  "/users/:targetUserId/posts",
  rateLimitMiddleware.generalLimiter,
  [
    validationMiddleware
      .param("targetUserId")
      .isMongoId()
      .withMessage("ID người dùng không hợp lệ"),
    validationMiddleware
      .query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Trang phải là số nguyên dương"),
    validationMiddleware
      .query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Giới hạn phải từ 1-50"),
  ],
  validationMiddleware.checkValidation,
  socialController.getUserPosts
);

router.delete(
  "/posts/:postId",
  rateLimitMiddleware.generalLimiter,
  [
    validationMiddleware
      .param("postId")
      .isMongoId()
      .withMessage("ID bài viết không hợp lệ"),
  ],
  validationMiddleware.checkValidation,
  socialController.deletePost
);

module.exports = router;
