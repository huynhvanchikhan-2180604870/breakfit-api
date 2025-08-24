const mongoose = require("mongoose");

/**
 * Post model for social feed and sharing
 * Handles user posts, achievements, and social interactions
 */
const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "achievement",
        "workout",
        "meal",
        "progress",
        "milestone",
        "general",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được quá 200 ký tự"],
    },
    content: {
      type: String,
      required: [true, "Nội dung là bắt buộc"],
      trim: true,
      maxlength: [2000, "Nội dung không được quá 2000 ký tự"],
    },
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: String,
        caption: String,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag không được quá 50 ký tự"],
      },
    ],
    privacy: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
      index: true,
    },
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
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
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Bình luận không được quá 500 ký tự"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        likes: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            createdAt: {
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
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    relatedData: {
      weightId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Weight",
      },
      mealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meal",
      },
      workoutId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workout",
      },
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
      },
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ privacy: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

// Virtual for engagement metrics
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

postSchema.virtual("shareCount").get(function () {
  return this.shares.length;
});

module.exports = mongoose.model("Post", postSchema);
