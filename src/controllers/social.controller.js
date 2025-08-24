const socialService = require("../services/social.service");
const logger = require("../utils/logger.util");

/**
 * Social controller for friend management and social interactions
 * Handles friend requests, social feed, and community features
 */
const socialController = {
  /**
   * Send friend request
   */
  async sendFriendRequest(req, res) {
    try {
      const userId = req.user._id;
      const { recipientId, message } = req.body;

      // Validate required fields
      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: "ID người nhận là bắt buộc",
        });
      }

      const result = await socialService.sendFriendRequest(
        userId,
        recipientId,
        message
      );

      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error in sendFriendRequest controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(req, res) {
    try {
      const userId = req.user._id;
      const { requestId } = req.params;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: "ID lời mời là bắt buộc",
        });
      }

      const result = await socialService.acceptFriendRequest(userId, requestId);

      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error in acceptFriendRequest controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get friends list
   */
  async getFriendsList(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 20 } = req.query;

      const result = await socialService.getFriendsList(userId, page, limit);

      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error in getFriendsList controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách bạn bè",
      });
    }
  },

  /**
   * Create social post
   */
  async createPost(req, res) {
    try {
      const userId = req.user._id;
      const { type, title, content, media, tags, privacy, relatedData } =
        req.body;

      // Validate required fields
      if (!type || !title || !content) {
        return res.status(400).json({
          success: false,
          message: "Loại, tiêu đề và nội dung là bắt buộc",
        });
      }

      const postData = {
        type,
        title,
        content,
        media: media || [],
        tags: tags || [],
        privacy: privacy || "public",
        relatedData,
      };

      const result = await socialService.createPost(userId, postData);

      return res.status(201).json(result);
    } catch (error) {
      logger.error("Error in createPost controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get social feed
   */
  async getSocialFeed(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 20 } = req.query;

      const result = await socialService.getSocialFeed(userId, page, limit);

      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error in getSocialFeed controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy bảng tin",
      });
    }
  },

  /**
   * Like/unlike post
   */
  async togglePostLike(req, res) {
    try {
      const userId = req.user._id;
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "ID bài viết là bắt buộc",
        });
      }

      const result = await socialService.togglePostLike(userId, postId);

      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error in togglePostLike controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: error.message,
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
          message: "ID bài viết và nội dung bình luận là bắt buộc",
        });
      }

      const result = await socialService.addComment(userId, postId, content);

      return res.status(201).json(result);
    } catch (error) {
      logger.error("Error in addComment controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Get user's posts
   */
  async getUserPosts(req, res) {
    try {
      const userId = req.user._id;
      const { targetUserId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const targetId = targetUserId || userId;

      // Get posts by user
      const posts = await socialService.getUserPosts(targetId, page, limit);

      return res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      logger.error("Error in getUserPosts controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy bài viết của người dùng",
      });
    }
  },

  /**
   * Delete post
   */
  async deletePost(req, res) {
    try {
      const userId = req.user._id;
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "ID bài viết là bắt buộc",
        });
      }

      const result = await socialService.deletePost(userId, postId);

      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error in deletePost controller", {
        error: error.message,
        userId: req.user._id,
      });

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = socialController;
