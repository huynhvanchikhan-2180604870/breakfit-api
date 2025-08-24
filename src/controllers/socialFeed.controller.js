const socialFeedService = require("../services/socialFeed.service");
const logger = require("../utils/logger.util");

/**
 * Social Feed controller for social media and community features
 * Handles posts, interactions, and content management
 */
const socialFeedController = {
  /**
   * Create a new post
   */
  async createPost(req, res) {
    try {
      const userId = req.user._id;
      const postData = req.body;

      // Validate required fields
      if (!postData.content || postData.content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nội dung bài đăng là bắt buộc",
        });
      }

      if (postData.content.length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Nội dung bài đăng không được quá 2000 ký tự",
        });
      }

      // Create post
      const post = await socialFeedService.createPost(postData, userId);

      logger.info("✅ Post created successfully", {
        userId,
        postId: post._id,
        postType: post.postType,
      });

      res.status(201).json({
        success: true,
        message: "Bài đăng đã được tạo thành công",
        data: { post },
      });
    } catch (error) {
      logger.error("❌ Create post failed", {
        error: error.message,
        userId: req.user?._id,
        postData: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Tạo bài đăng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get personalized feed for user
   */
  async getFeed(req, res) {
    try {
      const userId = req.user._id;
      const {
        page = 1,
        limit = 20,
        postTypes = [],
        visibility = "public",
        followingOnly = false,
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        postTypes: postTypes.length > 0 ? postTypes.split(",") : [],
        visibility,
        followingOnly: followingOnly === "true",
      };

      const result = await socialFeedService.getFeedForUser(userId, options);

      logger.info("✅ Feed retrieved successfully", {
        userId,
        count: result.posts.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Bảng tin đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get feed failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy bảng tin thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user's posts
   */
  async getUserPosts(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 20, postTypes = [] } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        postTypes: postTypes.length > 0 ? postTypes.split(",") : [],
      };

      const result = await socialFeedService.getUserPosts(userId, options);

      logger.info("✅ User posts retrieved successfully", {
        userId,
        count: result.posts.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Bài đăng của bạn đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get user posts failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy bài đăng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get trending posts
   */
  async getTrendingPosts(req, res) {
    try {
      const { limit = 10 } = req.query;

      const posts = await socialFeedService.getTrendingPosts(parseInt(limit));

      logger.info("✅ Trending posts retrieved successfully", {
        userId: req.user?._id,
        count: posts.length,
      });

      res.json({
        success: true,
        message: "Bài đăng trending đã được lấy thành công",
        data: { posts },
      });
    } catch (error) {
      logger.error("❌ Get trending posts failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy bài đăng trending thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Like/unlike a post
   */
  async toggleLike(req, res) {
    try {
      const userId = req.user._id;
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID là bắt buộc",
        });
      }

      const result = await socialFeedService.toggleLike(postId, userId);

      logger.info("✅ Post like toggled successfully", {
        userId,
        postId,
        action: result.action,
      });

      res.json({
        success: true,
        message: `Đã ${
          result.action === "liked" ? "thích" : "bỏ thích"
        } bài đăng thành công`,
        data: result,
      });
    } catch (error) {
      logger.error("❌ Toggle post like failed", {
        error: error.message,
        userId: req.user?._id,
        postId: req.params.postId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Thao tác thích bài đăng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Add comment to post
   */
  async addComment(req, res) {
    try {
      const userId = req.user._id;
      const { postId } = req.params;
      const { content } = req.body;

      if (!postId || !content) {
        return res.status(400).json({
          success: false,
          message: "Post ID và nội dung comment là bắt buộc",
        });
      }

      if (content.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Nội dung comment không được quá 500 ký tự",
        });
      }

      const post = await socialFeedService.addComment(postId, userId, content);

      logger.info("✅ Comment added successfully", {
        userId,
        postId,
        commentLength: content.length,
      });

      res.json({
        success: true,
        message: "Comment đã được thêm thành công",
        data: { post },
      });
    } catch (error) {
      logger.error("❌ Add comment failed", {
        error: error.message,
        userId: req.user?._id,
        postId: req.params.postId,
        content: req.body.content,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("not allowed")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Thêm comment thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Add reply to comment
   */
  async addReply(req, res) {
    try {
      const userId = req.user._id;
      const { postId, commentIndex } = req.params;
      const { content } = req.body;

      if (!postId || commentIndex === undefined || !content) {
        return res.status(400).json({
          success: false,
          message: "Post ID, comment index và nội dung reply là bắt buộc",
        });
      }

      if (content.length > 300) {
        return res.status(400).json({
          success: false,
          message: "Nội dung reply không được quá 300 ký tự",
        });
      }

      const post = await socialFeedService.addReply(
        postId,
        parseInt(commentIndex),
        userId,
        content
      );

      logger.info("✅ Reply added successfully", {
        userId,
        postId,
        commentIndex,
        replyLength: content.length,
      });

      res.json({
        success: true,
        message: "Reply đã được thêm thành công",
        data: { post },
      });
    } catch (error) {
      logger.error("❌ Add reply failed", {
        error: error.message,
        userId: req.user?._id,
        postId: req.params.postId,
        commentIndex: req.params.commentIndex,
        content: req.body.content,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Invalid comment index")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Thêm reply thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Share a post
   */
  async sharePost(req, res) {
    try {
      const userId = req.user._id;
      const { postId } = req.params;
      const { platform = "app" } = req.body;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID là bắt buộc",
        });
      }

      const post = await socialFeedService.sharePost(postId, userId, platform);

      logger.info("✅ Post shared successfully", {
        userId,
        postId,
        platform,
      });

      res.json({
        success: true,
        message: "Bài đăng đã được chia sẻ thành công",
        data: { post },
      });
    } catch (error) {
      logger.error("❌ Share post failed", {
        error: error.message,
        userId: req.user?._id,
        postId: req.params.postId,
        platform: req.body.platform,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("not allowed")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Chia sẻ bài đăng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Search posts
   */
  async searchPosts(req, res) {
    try {
      const {
        q,
        page = 1,
        limit = 20,
        postTypes = [],
        hashtags = [],
        authorId,
      } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Từ khóa tìm kiếm là bắt buộc",
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        postTypes: postTypes.length > 0 ? postTypes.split(",") : [],
        hashtags: hashtags.length > 0 ? hashtags.split(",") : [],
        authorId,
      };

      const result = await socialFeedService.searchPosts(q.trim(), options);

      logger.info("✅ Posts search completed successfully", {
        userId: req.user?._id,
        query: q,
        count: result.posts.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Tìm kiếm bài đăng hoàn thành",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Search posts failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Tìm kiếm bài đăng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get hashtag suggestions
   */
  async getHashtagSuggestions(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Từ khóa hashtag là bắt buộc",
        });
      }

      const suggestions = await socialFeedService.getHashtagSuggestions(
        q.trim(),
        parseInt(limit)
      );

      logger.info("✅ Hashtag suggestions retrieved successfully", {
        userId: req.user?._id,
        query: q,
        count: suggestions.length,
      });

      res.json({
        success: true,
        message: "Gợi ý hashtag đã được lấy thành công",
        data: { suggestions },
      });
    } catch (error) {
      logger.error("❌ Get hashtag suggestions failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy gợi ý hashtag thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Report a post
   */
  async reportPost(req, res) {
    try {
      const userId = req.user._id;
      const { postId } = req.params;
      const { reason } = req.body;

      if (!postId || !reason) {
        return res.status(400).json({
          success: false,
          message: "Post ID và lý do báo cáo là bắt buộc",
        });
      }

      const post = await socialFeedService.reportPost(postId, userId, reason);

      logger.info("✅ Post reported successfully", {
        userId,
        postId,
        reason,
      });

      res.json({
        success: true,
        message: "Báo cáo bài đăng thành công",
        data: { post },
      });
    } catch (error) {
      logger.error("❌ Report post failed", {
        error: error.message,
        userId: req.user?._id,
        postId: req.params.postId,
        reason: req.body.reason,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      // ... existing code từ dòng 1-580 ...

      res.status(500).json({
        success: false,
        message: "Báo cáo bài đăng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get post statistics
   */
  async getPostStats(req, res) {
    try {
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID là bắt buộc",
        });
      }

      const stats = await socialFeedService.getPostStats(postId);

      logger.info("✅ Post stats retrieved successfully", {
        userId: req.user?._id,
        postId,
      });

      res.json({
        success: true,
        message: "Thống kê bài đăng đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get post stats failed", {
        error: error.message,
        userId: req.user?._id,
        postId: req.params.postId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy thống kê bài đăng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * View a post (increment view count)
   */
  async viewPost(req, res) {
    try {
      const userId = req.user._id;
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID là bắt buộc",
        });
      }

      const post = await socialFeedService.viewPost(postId, userId);

      logger.info("✅ Post viewed successfully", {
        userId,
        postId,
      });

      res.json({
        success: true,
        message: "Đã xem bài đăng thành công",
        data: { post },
      });
    } catch (error) {
      logger.error("❌ View post failed", {
        error: error.message,
        userId: req.user?._id,
        postId: req.params.postId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Xem bài đăng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = socialFeedController;