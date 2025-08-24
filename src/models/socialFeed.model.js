const mongoose = require("mongoose");
const logger = require("../utils/logger.util");

/**
 * Social Feed Schema
 * Handles social media posts, interactions, and community features
 */
const socialFeedSchema = new mongoose.Schema(
  {
    // Post Content
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: String,
    authorAvatar: String,
    authorLevel: String, // fitness level for display

    // Post Type & Content
    postType: {
      type: String,
      enum: [
        "workout",
        "nutrition",
        "progress",
        "achievement",
        "motivation",
        "question",
        "challenge",
        "general",
      ],
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: true,
    },
    hashtags: [String],
    mentions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
      },
    ],

    // Media Content
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video", "gif"],
          required: true,
        },
        url: String,
        thumbnail: String,
        caption: String,
        order: Number,
      },
    ],

    // Fitness Data (for workout/nutrition posts)
    fitnessData: {
      workoutType: String,
      duration: Number, // minutes
      calories: Number,
      exercises: [
        {
          name: String,
          sets: Number,
          reps: Number,
          weight: Number,
        },
      ],
      nutritionInfo: {
        mealType: String,
        calories: Number,
        macros: {
          protein: Number,
          carbs: Number,
          fat: Number,
        },
      },
      progressMetrics: {
        weight: Number,
        bodyFat: Number,
        measurements: {
          chest: Number,
          waist: Number,
          arms: Number,
          legs: Number,
        },
      },
    },

    // Privacy & Visibility
    visibility: {
      type: String,
      enum: ["public", "friends", "private", "challenge"],
      default: "public",
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowSharing: {
      type: Boolean,
      default: true,
    },

    // Engagement Metrics
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        userAvatar: String,
        content: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        likes: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            timestamp: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        replies: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            userName: String,
            content: {
              type: String,
              trim: true,
              maxlength: 300,
            },
            timestamp: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    shares: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        platform: String, // app, external, etc.
      },
    ],
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Moderation & Safety
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: String,
    isHidden: {
      type: Boolean,
      default: false,
    },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "approved",
    },

    // AI & Analytics
    aiAnalysis: {
      sentiment: String, // positive, negative, neutral
      fitnessScore: Number, // 0-100
      engagementPrediction: Number, // 0-100
      recommendedHashtags: [String],
      contentQuality: Number, // 0-100
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
socialFeedSchema.index({ authorId: 1, createdAt: -1 });
socialFeedSchema.index({ postType: 1, createdAt: -1 });
socialFeedSchema.index({ visibility: 1, createdAt: -1 });
socialFeedSchema.index({ hashtags: 1 });
socialFeedSchema.index({ "likes.userId": 1 });
socialFeedSchema.index({ "comments.userId": 1 });
socialFeedSchema.index({ challengeId: 1 });

// Virtual fields
socialFeedSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

socialFeedSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

socialFeedSchema.virtual("shareCount").get(function () {
  return this.shares.length;
});

socialFeedSchema.virtual("viewCount").get(function () {
  return this.views.length;
});

socialFeedSchema.virtual("engagementScore").get(function () {
  return this.likeCount + this.commentCount * 2 + this.shareCount * 3;
});

socialFeedSchema.virtual("isLikedByUser").get(function () {
  return function (userId) {
    return this.likes.some((like) => like.userId.equals(userId));
  };
});

socialFeedSchema.virtual("isCommentedByUser").get(function () {
  return function (userId) {
    return this.comments.some((comment) => comment.userId.equals(userId));
  };
});

// Instance methods
socialFeedSchema.methods.addLike = function (userId, userName) {
  if (this.likes.some((like) => like.userId.equals(userId))) {
    throw new Error("User already liked this post");
  }

  this.likes.push({
    userId,
    userName,
    timestamp: new Date(),
  });

  return this;
};

socialFeedSchema.methods.removeLike = function (userId) {
  const likeIndex = this.likes.findIndex((like) => like.userId.equals(userId));
  if (likeIndex === -1) {
    throw new Error("User has not liked this post");
  }

  this.likes.splice(likeIndex, 1);
  return this;
};

socialFeedSchema.methods.addComment = function (
  userId,
  userName,
  userAvatar,
  content
) {
  if (!this.allowComments) {
    throw new Error("Comments are not allowed on this post");
  }

  this.comments.push({
    userId,
    userName,
    userAvatar,
    content,
    timestamp: new Date(),
    likes: [],
    replies: [],
  });

  return this;
};

socialFeedSchema.methods.addReply = function (
  commentIndex,
  userId,
  userName,
  content
) {
  if (commentIndex < 0 || commentIndex >= this.comments.length) {
    throw new Error("Invalid comment index");
  }

  this.comments[commentIndex].replies.push({
    userId,
    userName,
    content,
    timestamp: new Date(),
  });

  return this;
};

socialFeedSchema.methods.addShare = function (
  userId,
  userName,
  platform = "app"
) {
  this.shares.push({
    userId,
    userName,
    timestamp: new Date(),
    platform,
  });

  return this;
};

socialFeedSchema.methods.addView = function (userId) {
  // Check if user already viewed
  if (!this.views.some((view) => view.userId.equals(userId))) {
    this.views.push({
      userId,
      timestamp: new Date(),
    });
  }

  return this;
};

socialFeedSchema.methods.toggleLike = function (userId, userName) {
  const existingLike = this.likes.find((like) => like.userId.equals(userId));

  if (existingLike) {
    this.removeLike(userId);
    return { action: "unliked", likeCount: this.likes.length };
  } else {
    this.addLike(userId, userName);
    return { action: "liked", likeCount: this.likes.length };
  }
};

// Static methods
socialFeedSchema.statics.getFeedForUser = function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    postTypes = [],
    visibility = "public",
    followingOnly = false,
  } = options;

  let query = {
    $or: [
      { visibility: "public" },
      { authorId: userId },
      { visibility: "friends" }, // Will be filtered by following
    ],
  };

  if (postTypes.length > 0) {
    query.postType = { $in: postTypes };
  }

  if (visibility !== "all") {
    query.visibility = visibility;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate("authorId", "fullName avatar fitnessLevel")
    .populate("challengeId", "title");
};

socialFeedSchema.statics.getUserPosts = function (userId, options = {}) {
  const { page = 1, limit = 20, postTypes = [] } = options;

  let query = { authorId: userId };

  if (postTypes.length > 0) {
    query.postType = { $in: postTypes };
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate("authorId", "fullName avatar fitnessLevel");
};

socialFeedSchema.statics.getTrendingPosts = function (limit = 10) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        visibility: "public",
        moderationStatus: "approved",
      },
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $size: "$likes" },
            { $multiply: [{ $size: "$comments" }, 2] },
            { $multiply: [{ $size: "$shares" }, 3] },
          ],
        },
      },
    },
    {
      $sort: { engagementScore: -1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "author",
      },
    },
    {
      $unwind: "$author",
    },
  ]);
};

// Pre-save middleware
socialFeedSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-generate hashtags from content if none provided
  if (!this.hashtags || this.hashtags.length === 0) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.content.match(hashtagRegex);
    if (matches) {
      this.hashtags = matches.map((tag) => tag.substring(1));
    }
  }

  next();
});

const SocialFeed = mongoose.model("SocialFeed", socialFeedSchema);

module.exports = SocialFeed;
