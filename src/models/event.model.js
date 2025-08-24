const mongoose = require("mongoose");

/**
 * Event model for tracking user activities and system events
 * Used for analytics, notifications, and audit trails
 */
const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, "Loại event là bắt buộc"],
      enum: [
        // User actions
        "user.login",
        "user.logout",
        "user.register",
        "user.profile_update",
        "user.password_change",
        "user.email_verify",

        // Fitness tracking
        "weight.logged",
        "weight.updated",
        "weight.deleted",
        "meal.logged",
        "meal.updated",
        "meal.deleted",
        "workout.completed",
        "workout.updated",
        "workout.deleted",
        "plan.completed",
        "plan.skipped",

        // Gamification
        "xp.earned",
        "level.up",
        "badge.earned",
        "achievement.completed",
        "streak.increased",
        "streak.broken",

        // Challenges
        "challenge.joined",
        "challenge.left",
        "challenge.completed",
        "challenge.milestone_reached",

        // Photos
        "photo.uploaded",
        "photo.deleted",
        "photo.analyzed",

        // System events
        "system.maintenance",
        "system.update",
        "system.error",
      ],
    },
    category: {
      type: String,
      enum: ["user", "fitness", "gamification", "challenge", "photo", "system"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, "Tiêu đề không được quá 200 ký tự"],
    },
    description: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relatedIds: {
      weightId: mongoose.Schema.Types.ObjectId,
      mealId: mongoose.Schema.Types.ObjectId,
      workoutId: mongoose.Schema.Types.ObjectId,
      planId: mongoose.Schema.Types.ObjectId,
      photoId: mongoose.Schema.Types.ObjectId,
      challengeId: mongoose.Schema.Types.ObjectId,
      badgeId: String,
      achievementId: String,
    },
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      timezone: String,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    processedAt: Date,
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
eventSchema.index({ userId: 1, type: 1 });
eventSchema.index({ userId: 1, createdAt: -1 });
eventSchema.index({ type: 1, category: 1 });
eventSchema.index({ severity: 1, createdAt: -1 });
eventSchema.index({ isProcessed: 1, createdAt: -1 });

// Virtuals
eventSchema.virtual("isRecent").get(function () {
  const now = new Date();
  const eventTime = new Date(this.createdAt);
  const diffHours = (now - eventTime) / (1000 * 60 * 60);
  return diffHours < 24;
});

eventSchema.virtual("ageInHours").get(function () {
  const now = new Date();
  const eventTime = new Date(this.createdAt);
  return Math.floor((now - eventTime) / (1000 * 60 * 60));
});

eventSchema.virtual("ageInDays").get(function () {
  const now = new Date();
  const eventTime = new Date(this.createdAt);
  return Math.floor((now - eventTime) / (1000 * 60 * 60 * 24));
});

// Instance methods
eventSchema.methods = {
  /**
   * Mark event as processed
   */
  markProcessed() {
    this.isProcessed = true;
    this.processedAt = new Date();
    return this.save();
  },

  /**
   * Add metadata
   */
  addMetadata(key, value) {
    if (!this.metadata) this.metadata = {};
    this.metadata[key] = value;
    return this;
  },

  /**
   * Get metadata value
   */
  getMetadata(key, defaultValue = null) {
    return this.metadata?.[key] ?? defaultValue;
  },

  /**
   * Check if event has related entity
   */
  hasRelatedEntity(entityType) {
    const entityKey = `${entityType}Id`;
    return this.relatedIds && this.relatedIds[entityKey];
  },

  /**
   * Get related entity ID
   */
  getRelatedEntityId(entityType) {
    const entityKey = `${entityType}Id`;
    return this.relatedIds?.[entityKey];
  },
};

// Static methods
eventSchema.statics = {
  /**
   * Create event with automatic category detection
   */
  async createEvent(
    userId,
    type,
    title,
    description = "",
    metadata = {},
    relatedIds = {}
  ) {
    // Auto-detect category from type
    const categoryMap = {
      user: [
        "user.login",
        "user.logout",
        "user.register",
        "user.profile_update",
      ],
      fitness: [
        "weight.logged",
        "meal.logged",
        "workout.completed",
        "plan.completed",
      ],
      gamification: [
        "xp.earned",
        "level.up",
        "badge.earned",
        "achievement.completed",
      ],
      challenge: [
        "challenge.joined",
        "challenge.completed",
        "challenge.milestone_reached",
      ],
      photo: ["photo.uploaded", "photo.deleted", "photo.analyzed"],
      system: ["system.maintenance", "system.update", "system.error"],
    };

    let category = "system";
    for (const [cat, types] of Object.entries(categoryMap)) {
      if (types.includes(type)) {
        category = cat;
        break;
      }
    }

    // Auto-detect severity
    let severity = "low";
    if (type.includes("error") || type.includes("critical"))
      severity = "critical";
    else if (type.includes("warning") || type.includes("high"))
      severity = "high";
    else if (type.includes("medium")) severity = "medium";

    const event = new this({
      userId,
      type,
      category,
      severity,
      title,
      description,
      metadata,
      relatedIds,
    });

    return event.save();
  },

  /**
   * Get user events by type
   */
  async getUserEventsByType(userId, type, limit = 50) {
    return this.find({ userId, type }).sort({ createdAt: -1 }).limit(limit);
  },

  /**
   * Get user events by category
   */
  async getUserEventsByCategory(userId, category, limit = 50) {
    return this.find({ userId, category }).sort({ createdAt: -1 }).limit(limit);
  },

  /**
   * Get events by date range
   */
  async getEventsByDateRange(userId, startDate, endDate, limit = 100) {
    return this.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  /**
   * Get unprocessed events
   */
  async getUnprocessedEvents(limit = 100) {
    return this.find({ isProcessed: false })
      .sort({ createdAt: 1 })
      .limit(limit);
  },

  /**
   * Get event statistics
   */
  async getEventStatistics(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          types: { $addToSet: "$type" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  },

  /**
   * Clean old events
   */
  async cleanOldEvents(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
      isProcessed: true,
      severity: { $ne: "critical" },
    });

    return result.deletedCount;
  },
};

module.exports = mongoose.model("Event", eventSchema);
