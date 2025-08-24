const mongoose = require("mongoose");

/**
 * Friend model for social connections
 * Handles friend requests, relationships, and social network
 */
const friendSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
      index: true,
    },
    requestMessage: {
      type: String,
      maxlength: [200, "Tin nhắn không được quá 200 ký tự"],
    },
    acceptedAt: {
      type: Date,
    },
    blockedAt: {
      type: Date,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique friend relationships
friendSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

// Virtual for friend relationship
friendSchema.virtual("isActive").get(function () {
  return this.status === "accepted";
});

module.exports = mongoose.model("Friend", friendSchema);
