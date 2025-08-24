const SocialFeed = require("../models/socialFeed.model");
const User = require("../models/user.model");
const aiService = require("./ai.service");
const logger = require("../utils/logger.util");

/**
 * Social Feed service for social media and community features
 * Handles posts, interactions, and content moderation
 */
const socialFeedService = {
  /**
   * Create a new post
   */
  async createPost(postData, userId) {
    try {
      // Get author info
      const author = await User.findById(userId).select(
        "fullName avatar fitnessLevel"
      );
      if (!author) {
        throw new Error("Author not found");
      }

      // Validate post data
      if (!postData.content || postData.content.trim().length === 0) {
        throw new Error("Post content is required");
      }

      // Create post
      const post = new SocialFeed({
        ...postData,
        authorId: userId,
        authorName: author.fullName,
        authorAvatar: author.avatar,
        authorLevel: author.fitnessLevel,
      });

      // AI analysis for content quality and recommendations
      if (process.env.ENABLE_AI_ANALYSIS === "true") {
        try {
          const aiAnalysis = await this.analyzePostContent(post.content);
          post.aiAnalysis = aiAnalysis;
        } catch (aiError) {
          logger.warn("AI analysis failed, continuing without it", {
            error: aiError.message,
            postId: post._id,
          });
        }
      }

      await post.save();

      logger.info("✅ Post created successfully", {
        postId: post._id,
        authorId: userId,
        postType: post.postType,
      });

      return post;
    } catch (error) {
      logger.error("❌ Failed to create post", {
        error: error.message,
        authorId: userId,
        postData,
      });
      throw error;
    }
  },

  /**
   * Get personalized feed for user
   */
  async getFeedForUser(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        postTypes = [],
        visibility = "public",
        followingOnly = false,
      } = options;

      // Get user's following list if followingOnly is true
      let followingIds = [];
      if (followingOnly) {
        const user = await User.findById(userId).select("following");
        followingIds = user?.following || [];
      }

      // Build query
      let query = {
        $or: [
          { visibility: "public" },
          { authorId: userId },
          { visibility: "friends" },
        ],
        moderationStatus: "approved",
        isHidden: false,
      };

      if (postTypes.length > 0) {
        query.postType = { $in: postTypes };
      }

      if (visibility !== "all") {
        query.visibility = visibility;
      }

      // Execute query
      const posts = await SocialFeed.getFeedForUser(userId, {
        page,
        limit,
        postTypes,
        visibility,
        followingOnly,
      });

      // Get total count
      const total = await SocialFeed.countDocuments(query);

      // Add user-specific data
      const postsWithUserData = posts.map((post) => {
        const postObj = post.toObject();
        postObj.isLikedByUser = post.isLikedByUser(userId);
        postObj.isCommentedByUser = post.isCommentedByUser(userId);
        return postObj;
      });

      return {
        posts: postsWithUserData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("❌ Failed to get feed for user", {
        error: error.message,
        userId,
        options,
      });
      throw error;
    }
  },

  /**
   * Get user's posts
   */
  async getUserPosts(userId, options = {}) {
    try {
      const { page = 1, limit = 20, postTypes = [] } = options;

      const result = await SocialFeed.getUserPosts(userId, {
        page,
        limit,
        postTypes,
      });

      // Get total count
      const query = { authorId: userId };
      if (postTypes.length > 0) {
        query.postType = { $in: postTypes };
      }
      const total = await SocialFeed.countDocuments(query);

      return {
        posts: result,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("❌ Failed to get user posts", {
        error: error.message,
        userId,
        options,
      });
      throw error;
    }
  },

  /**
   * Get trending posts
   */
  async getTrendingPosts(limit = 10) {
    try {
      const posts = await SocialFeed.getTrendingPosts(limit);

      logger.info("✅ Trending posts retrieved successfully", {
        count: posts.length,
      });

      return posts;
    } catch (error) {
      logger.error("❌ Failed to get trending posts", {
        error: error.message,
        limit,
      });
      throw error;
    }
  },

  /**
   * Like/unlike a post
   */
  async toggleLike(postId, userId) {
    try {
      const post = await SocialFeed.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      // Get user info for like
      const user = await User.findById(userId).select("fullName");
      if (!user) {
        throw new Error("User not found");
      }

      // Toggle like
      const result = post.toggleLike(userId, user.fullName);
      await post.save();

      logger.info("✅ Post like toggled successfully", {
        postId,
        userId,
        action: result.action,
        likeCount: result.likeCount,
      });

      return result;
    } catch (error) {
      logger.error("❌ Failed to toggle post like", {
        error: error.message,
        postId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Add comment to post
   */
  async addComment(postId, userId, content) {
    try {
      const post = await SocialFeed.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      if (!post.allowComments) {
        throw new Error("Comments are not allowed on this post");
      }

      // Get user info
      const user = await User.findById(userId).select("fullName avatar");
      if (!user) {
        throw new Error("User not found");
      }

      // Add comment
      post.addComment(userId, user.fullName, user.avatar, content);
      await post.save();

      logger.info("✅ Comment added successfully", {
        postId,
        userId,
        commentLength: content.length,
      });

      return post;
    } catch (error) {
      logger.error("❌ Failed to add comment", {
        error: error.message,
        postId,
        userId,
        content,
      });
      throw error;
    }
  },

  /**
   * Add reply to comment
   */
  async addReply(postId, commentIndex, userId, content) {
    try {
      const post = await SocialFeed.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      // Get user info
      const user = await User.findById(userId).select("fullName");
      if (!user) {
        throw new Error("User not found");
      }

      // Add reply
      post.addReply(commentIndex, userId, user.fullName, content);
      await post.save();

      logger.info("✅ Reply added successfully", {
        postId,
        userId,
        commentIndex,
        replyLength: content.length,
      });

      return post;
    } catch (error) {
      logger.error("❌ Failed to add reply", {
        error: error.message,
        postId,
        commentIndex,
        userId,
        content,
      });
      throw error;
    }
  },

  /**
   * Share a post
   */
  async sharePost(postId, userId, platform = "app") {
    try {
      const post = await SocialFeed.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      if (!post.allowSharing) {
        throw new Error("Sharing is not allowed on this post");
      }

      // Get user info
      const user = await User.findById(userId).select("fullName");
      if (!user) {
        throw new Error("User not found");
      }

      // Add share
      post.addShare(userId, user.fullName, platform);
      await post.save();

      logger.info("✅ Post shared successfully", {
        postId,
        userId,
        platform,
      });

      return post;
    } catch (error) {
      logger.error("❌ Failed to share post", {
        error: error.message,
        postId,
        userId,
        platform,
      });
      throw error;
    }
  },

  /**
   * View a post
   */
  async viewPost(postId, userId) {
    try {
      const post = await SocialFeed.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      // Add view
      post.addView(userId);
      await post.save();

      logger.info("✅ Post viewed successfully", {
        postId,
        userId,
      });

      return post;
    } catch (error) {
      logger.error("❌ Failed to view post", {
        error: error.message,
        postId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Search posts
   */
  async searchPosts(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        postTypes = [],
        hashtags = [],
        authorId,
      } = options;

      // Build search query
      const searchQuery = {
        $and: [
          {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { content: { $regex: query, $options: "i" } },
              { hashtags: { $in: [new RegExp(query, "i")] } },
            ],
          },
          { visibility: "public" },
          { moderationStatus: "approved" },
          { isHidden: false },
        ],
      };

      if (postTypes.length > 0) {
        searchQuery.postType = { $in: postTypes };
      }

      if (hashtags.length > 0) {
        searchQuery.hashtags = { $in: hashtags };
      }

      if (authorId) {
        searchQuery.authorId = authorId;
      }

      // Execute search
      const posts = await SocialFeed.find(searchQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate("authorId", "fullName avatar fitnessLevel");

      // Get total count
      const total = await SocialFeed.countDocuments(searchQuery);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        query,
      };
    } catch (error) {
      logger.error("❌ Failed to search posts", {
        error: error.message,
        query,
        options,
      });
      throw error;
    }
  },

  /**
   * Get hashtag suggestions
   */
  async getHashtagSuggestions(query, limit = 10) {
    try {
      const hashtags = await SocialFeed.aggregate([
        {
          $match: {
            hashtags: { $regex: query, $options: "i" },
            visibility: "public",
            moderationStatus: "approved",
          },
        },
        {
          $unwind: "$hashtags",
        },
        {
          $match: {
            hashtags: { $regex: query, $options: "i" },
          },
        },
        {
          $group: {
            _id: "$hashtags",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return hashtags.map((tag) => ({
        hashtag: tag._id,
        count: tag.count,
      }));
    } catch (error) {
      logger.error("❌ Failed to get hashtag suggestions", {
        error: error.message,
        query,
      });
      throw error;
    }
  },

  /**
   * Report a post
   */
  async reportPost(postId, userId, reason) {
    try {
      const post = await SocialFeed.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      // Mark as reported
      post.isReported = true;
      post.reportReason = reason;
      post.moderationStatus = "flagged";

      await post.save();

      logger.info("✅ Post reported successfully", {
        postId,
        userId,
        reason,
      });

      return post;
    } catch (error) {
      logger.error("❌ Failed to report post", {
        error: error.message,
        postId,
        userId,
        reason,
      });
      throw error;
    }
  },

  /**
   * AI analysis for post content
   */
  async analyzePostContent(content) {
    try {
      // This would integrate with AI service for content analysis
      // For now, return basic analysis
      const analysis = {
        sentiment: "positive", // Would be determined by AI
        fitnessScore: 75, // Would be calculated based on fitness-related keywords
        engagementPrediction: 80, // Would be predicted by AI
        recommendedHashtags: ["fitness", "motivation", "health"],
        contentQuality: 85, // Would be assessed by AI
      };

      return analysis;
    } catch (error) {
      logger.error("❌ Failed to analyze post content", {
        error: error.message,
        content: content.substring(0, 100),
      });
      throw error;
    }
  },

  /**
   * Get post statistics
   */
  async getPostStats(postId) {
    try {
      const post = await SocialFeed.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      const stats = {
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
        viewCount: post.viewCount,
        engagementScore: post.engagementScore,
        reach: post.viewCount + post.shareCount * 10, // Estimated reach
        virality: post.shareCount / Math.max(post.viewCount, 1), // Share-to-view ratio
      };

      return stats;
    } catch (error) {
      logger.error("❌ Failed to get post stats", {
        error: error.message,
        postId,
      });
      throw error;
    }
  },
};

module.exports = socialFeedService;
