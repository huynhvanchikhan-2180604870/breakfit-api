const Friend = require("../models/friend.model");
const Post = require("../models/post.model");
const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const logger = require("../utils/logger.util");

/**
 * Social service for friend management and social interactions
 * Handles friend requests, social feed, and community features
 */
const socialService = {
  /**
   * Send friend request
   */
  async sendFriendRequest(requesterId, recipientId, message = "") {
    try {
      // Check if users exist
      const [requester, recipient] = await Promise.all([
        User.findById(requesterId),
        User.findById(recipientId),
      ]);

      if (!requester || !recipient) {
        throw new Error("Người dùng không tồn tại");
      }

      if (requesterId === recipientId) {
        throw new Error("Không thể gửi lời mời kết bạn cho chính mình");
      }

      // Check existing relationship
      const existingFriend = await Friend.findOne({
        $or: [
          { requesterId, recipientId },
          { requesterId: recipientId, recipientId: requesterId },
        ],
      });

      if (existingFriend) {
        if (existingFriend.status === "accepted") {
          throw new Error("Đã là bạn bè");
        } else if (existingFriend.status === "pending") {
          throw new Error("Lời mời kết bạn đã được gửi");
        } else if (existingFriend.status === "blocked") {
          throw new Error("Không thể gửi lời mời kết bạn");
        }
      }

      // Create friend request
      const friendRequest = new Friend({
        requesterId,
        recipientId,
        requestMessage: message,
      });

      await friendRequest.save();

      logger.info("Friend request sent", {
        requesterId,
        recipientId,
        requestId: friendRequest._id,
      });

      return {
        success: true,
        message: "Đã gửi lời mời kết bạn",
        data: friendRequest,
      };
    } catch (error) {
      logger.error("Error sending friend request", { error: error.message });
      throw error;
    }
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId, requestId) {
    try {
      const friendRequest = await Friend.findById(requestId);

      if (!friendRequest) {
        throw new Error("Lời mời kết bạn không tồn tại");
      }

      if (friendRequest.recipientId.toString() !== userId) {
        throw new Error("Không có quyền chấp nhận lời mời này");
      }

      if (friendRequest.status !== "pending") {
        throw new Error("Lời mời kết bạn đã được xử lý");
      }

      friendRequest.status = "accepted";
      friendRequest.acceptedAt = new Date();
      await friendRequest.save();

      logger.info("Friend request accepted", {
        requestId,
        userId,
        friendId: friendRequest.requesterId,
      });

      return {
        success: true,
        message: "Đã chấp nhận lời mời kết bạn",
        data: friendRequest,
      };
    } catch (error) {
      logger.error("Error accepting friend request", { error: error.message });
      throw error;
    }
  },

  /**
   * Get user's friends list
   */
  async getFriendsList(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const friends = await Friend.find({
        $or: [
          { requesterId: userId, status: "accepted" },
          { recipientId: userId, status: "accepted" },
        ],
      })
        .populate("requesterId", "name email profilePicture")
        .populate("recipientId", "name email profilePicture")
        .sort({ acceptedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Friend.countDocuments({
        $or: [
          { requesterId: userId, status: "accepted" },
          { recipientId: userId, status: "accepted" },
        ],
      });

      // Format friends data
      const friendsList = friends.map((friend) => {
        const isRequester = friend.requesterId._id.toString() === userId;
        const friendUser = isRequester
          ? friend.recipientId
          : friend.requesterId;

        return {
          _id: friend._id,
          friendId: friendUser._id,
          name: friendUser.name,
          email: friendUser.email,
          profilePicture: friendUser.profilePicture,
          friendshipDate: friend.acceptedAt,
          isRequester,
        };
      });

      return {
        success: true,
        data: {
          friends: friendsList,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      logger.error("Error getting friends list", { error: error.message });
      throw error;
    }
  },

  /**
   * Create social post
   */
  async createPost(userId, postData) {
    try {
      const { type, title, content, media, tags, privacy, relatedData } =
        postData;

      // Validate post type and related data
      if (type !== "general" && !relatedData) {
        throw new Error("Post loại này cần có dữ liệu liên quan");
      }

      const post = new Post({
        authorId: userId,
        type,
        title,
        content,
        media: media || [],
        tags: tags || [],
        privacy,
        relatedData,
      });

      await post.save();

      // Populate author info
      await post.populate("authorId", "name email profilePicture");

      logger.info("Post created", {
        postId: post._id,
        authorId: userId,
        type,
      });

      return {
        success: true,
        message: "Đã tạo bài viết thành công",
        data: post,
      };
    } catch (error) {
      logger.error("Error creating post", { error: error.message });
      throw error;
    }
  },

  /**
   * Get social feed
   */
  async getSocialFeed(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get user's friends
      const friends = await Friend.find({
        $or: [
          { requesterId: userId, status: "accepted" },
          { recipientId: userId, status: "accepted" },
        ],
      });

      const friendIds = friends.map((friend) => {
        return friend.requesterId.toString() === userId
          ? friend.recipientId
          : friend.requesterId;
      });

      // Get posts from user and friends
      const posts = await Post.find({
        $or: [
          { authorId: userId },
          { authorId: { $in: friendIds }, privacy: "friends" },
          { privacy: "public" },
        ],
        isDeleted: false,
      })
        .populate("authorId", "name email profilePicture")
        .populate("likes.userId", "name profilePicture")
        .populate("comments.userId", "name profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Post.countDocuments({
        $or: [
          { authorId: userId },
          { authorId: { $in: friendIds }, privacy: "friends" },
          { privacy: "public" },
        ],
        isDeleted: false,
      });

      return {
        success: true,
        data: {
          posts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      logger.error("Error getting social feed", { error: error.message });
      throw error;
    }
  },

  /**
   * Like/unlike post
   */
  async togglePostLike(userId, postId) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error("Bài viết không tồn tại");
      }

      const existingLike = post.likes.find(
        (like) => like.userId.toString() === userId
      );

      if (existingLike) {
        // Unlike
        post.likes = post.likes.filter(
          (like) => like.userId.toString() !== userId
        );
        await post.save();

        return {
          success: true,
          message: "Đã bỏ thích bài viết",
          data: { liked: false, likeCount: post.likes.length },
        };
      } else {
        // Like
        post.likes.push({ userId });
        await post.save();

        return {
          success: true,
          message: "Đã thích bài viết",
          data: { liked: true, likeCount: post.likes.length },
        };
      }
    } catch (error) {
      logger.error("Error toggling post like", { error: error.message });
      throw error;
    }
  },

  /**
   * Add comment to post
   */
  async addComment(userId, postId, content) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error("Bài viết không tồn tại");
      }

      post.comments.push({
        userId,
        content,
      });

      await post.save();

      // Populate comment author
      const newComment = post.comments[post.comments.length - 1];
      await newComment.populate("userId", "name profilePicture");

      return {
        success: true,
        message: "Đã thêm bình luận",
        data: newComment,
      };
    } catch (error) {
      logger.error("Error adding comment", { error: error.message });
      throw error;
    }
  },
};

module.exports = socialService;
