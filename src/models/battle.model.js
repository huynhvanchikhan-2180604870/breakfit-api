const mongoose = require("mongoose");
const logger = require("../utils/logger.util");

/**
 * Battle Schema
 * Handles 1-1 battles between users with stakes and scoring
 */
const battleSchema = new mongoose.Schema(
  {
    // Battle Info
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Battle Configuration
    battleType: {
      type: String,
      enum: [
        "weight_loss",
        "muscle_gain",
        "endurance",
        "strength",
        "nutrition",
        "general",
      ],
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },
    metric: {
      type: String,
      enum: [
        "weight_pct",
        "muscle_gain",
        "workout_frequency",
        "nutrition_score",
        "streak_days",
        "custom",
      ],
      required: true,
    },
    customMetric: {
      name: String,
      unit: String,
      targetValue: Number,
    },

    // Participants
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorName: String,
    opponentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    opponentName: String,

    // Battle Status
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled", "expired"],
      default: "pending",
    },

    // Stakes & Rewards
    stakes: {
      type: {
        type: String,
        enum: ["xp", "badge", "title", "real_prize"],
        required: true,
      },
      value: mongoose.Schema.Types.Mixed,
      description: String,
    },

    // Battle Timeline
    startDate: Date,
    endDate: Date,
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,

    // Progress Tracking
    creatorProgress: {
      baseline: mongoose.Schema.Types.Mixed,
      current: mongoose.Schema.Types.Mixed,
      improvement: Number, // Percentage improvement
      lastUpdated: Date,
      dailyLogs: [
        {
          date: Date,
          value: mongoose.Schema.Types.Mixed,
          note: String,
        },
      ],
    },
    opponentProgress: {
      baseline: mongoose.Schema.Types.Mixed,
      current: mongoose.Schema.Types.Mixed,
      improvement: Number,
      lastUpdated: Date,
      dailyLogs: [
        {
          date: Date,
          value: mongoose.Schema.Types.Mixed,
          note: String,
        },
      ],
    },

    // Battle Results
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    winnerName: String,
    results: {
      creatorScore: Number,
      opponentScore: Number,
      margin: Number, // Difference between scores
      tie: Boolean,
    },

    // Battle Rules
    rules: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    verificationRequired: {
      type: Boolean,
      default: true,
    },
    allowSpectators: {
      type: Boolean,
      default: true,
    },

    // Spectators & Supporters
    spectators: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: Date,
        supportFor: {
          type: String,
          enum: ["creator", "opponent", "neutral"],
          default: "neutral",
        },
      },
    ],

    // Battle Chat & Updates
    updates: [
      {
        type: {
          type: String,
          enum: ["progress", "milestone", "trash_talk", "encouragement"],
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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
battleSchema.index({ status: 1, startDate: 1 });
battleSchema.index({ creatorId: 1, status: 1 });
battleSchema.index({ opponentId: 1, status: 1 });
battleSchema.index({ battleType: 1, status: 1 });
battleSchema.index({ "spectators.userId": 1 });

// Virtual fields
battleSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

battleSchema.virtual("daysRemaining").get(function () {
  if (this.status !== "active" || !this.endDate) return 0;
  const now = new Date();
  if (now > this.endDate) return 0;
  return Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24));
});

battleSchema.virtual("progressPercentage").get(function () {
  if (this.status !== "active" || !this.startDate || !this.endDate) return 0;
  const now = new Date();
  const total = this.endDate - this.startDate;
  const elapsed = now - this.startDate;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

battleSchema.virtual("canAccept").get(function () {
  return this.status === "pending" && !this.opponentId;
});

battleSchema.virtual("canStart").get(function () {
  return this.status === "pending" && this.opponentId && this.acceptedAt;
});

// Instance methods
battleSchema.methods.canUserAccept = function (userId) {
  if (this.status !== "pending") {
    return { canAccept: false, reason: "Battle is not pending" };
  }

  if (this.creatorId.equals(userId)) {
    return {
      canAccept: false,
      reason: "Creator cannot accept their own battle",
    };
  }

  if (this.opponentId && this.opponentId.equals(userId)) {
    return { canAccept: false, reason: "User is already the opponent" };
  }

  return { canAccept: true };
};

battleSchema.methods.acceptBattle = function (opponentId, opponentName) {
  if (this.status !== "pending") {
    throw new Error("Battle is not pending");
  }

  if (this.opponentId) {
    throw new Error("Battle already has an opponent");
  }

  this.opponentId = opponentId;
  this.opponentName = opponentName;
  this.acceptedAt = new Date();
  this.status = "pending"; // Will be changed to active when started

  // Set start and end dates
  this.startDate = new Date();
  this.endDate = new Date(Date.now() + this.durationDays * 24 * 60 * 60 * 1000);

  return this;
};

battleSchema.methods.startBattle = function () {
  if (this.status !== "pending" || !this.opponentId) {
    throw new Error("Battle cannot be started");
  }

  this.status = "active";
  this.startedAt = new Date();

  // Initialize baseline measurements
  this.creatorProgress.baseline = null;
  this.opponentProgress.baseline = null;

  return this;
};

battleSchema.methods.setBaseline = function (userId, baselineValue) {
  if (this.status !== "active") {
    throw new Error("Battle is not active");
  }

  if (this.creatorId.equals(userId)) {
    this.creatorProgress.baseline = baselineValue;
    this.creatorProgress.lastUpdated = new Date();
  } else if (this.opponentId.equals(userId)) {
    this.opponentProgress.baseline = baselineValue;
    this.opponentProgress.lastUpdated = new Date();
  } else {
    throw new Error("User is not a participant in this battle");
  }

  return this;
};

battleSchema.methods.updateProgress = function (
  userId,
  currentValue,
  note = ""
) {
  if (this.status !== "active") {
    throw new Error("Battle is not active");
  }

  let progress;
  if (this.creatorId.equals(userId)) {
    progress = this.creatorProgress;
  } else if (this.opponentId.equals(userId)) {
    progress = this.opponentProgress;
  } else {
    throw new Error("User is not a participant in this battle");
  }

  // Update current value
  progress.current = currentValue;
  progress.lastUpdated = new Date();

  // Calculate improvement if baseline exists
  if (progress.baseline !== null) {
    progress.improvement = this.calculateImprovement(
      progress.baseline,
      currentValue
    );
  }

  // Add daily log
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingLogIndex = progress.dailyLogs.findIndex((log) => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });

  if (existingLogIndex >= 0) {
    progress.dailyLogs[existingLogIndex] = {
      date: today,
      value: currentValue,
      note,
    };
  } else {
    progress.dailyLogs.push({
      date: today,
      value: currentValue,
      note,
    });
  }

  return this;
};

battleSchema.methods.calculateImprovement = function (baseline, current) {
  if (baseline === null || current === null) return 0;

  // For weight loss, negative improvement is better
  if (this.metric === "weight_pct") {
    const change = ((current - baseline) / baseline) * 100;
    return -change; // Negative for weight loss
  }

  // For other metrics, positive improvement is better
  if (typeof baseline === "number" && typeof current === "number") {
    return ((current - baseline) / baseline) * 100;
  }

  return 0;
};

battleSchema.methods.completeBattle = function () {
  if (this.status !== "active") {
    throw new Error("Battle is not active");
  }

  // Calculate final scores
  const creatorScore = this.creatorProgress.improvement || 0;
  const opponentScore = this.opponentProgress.improvement || 0;

  // Determine winner
  let winner = null;
  let winnerName = null;
  let tie = false;

  if (creatorScore > opponentScore) {
    winner = this.creatorId;
    winnerName = this.creatorName;
  } else if (opponentScore > creatorScore) {
    winner = this.opponentId;
    winnerName = this.opponentName;
  } else {
    tie = true;
  }

  // Set results
  this.results = {
    creatorScore,
    opponentScore,
    margin: Math.abs(creatorScore - opponentScore),
    tie,
  };

  this.winner = winner;
  this.winnerName = winnerName;
  this.status = "completed";
  this.completedAt = new Date();

  return this;
};

battleSchema.methods.addUpdate = function (userId, userName, type, message) {
  if (
    !this.allowSpectators &&
    !this.creatorId.equals(userId) &&
    !this.opponentId.equals(userId)
  ) {
    throw new Error("Spectators are not allowed to add updates");
  }

  this.updates.push({
    type,
    userId,
    userName,
    message,
    timestamp: new Date(),
  });

  return this;
};

battleSchema.methods.addSpectator = function (userId, supportFor = "neutral") {
  if (!this.allowSpectators) {
    throw new Error("Spectators are not allowed");
  }

  const existingSpectator = this.spectators.find((s) =>
    s.userId.equals(userId)
  );
  if (existingSpectator) {
    existingSpectator.supportFor = supportFor;
  } else {
    this.spectators.push({
      userId,
      joinedAt: new Date(),
      supportFor,
    });
  }

  return this;
};

// Static methods
battleSchema.statics.getActiveBattles = function () {
  return this.find({ status: "active" }).sort({ createdAt: -1 });
};

battleSchema.statics.getPendingBattles = function () {
  return this.find({ status: "pending" }).sort({ createdAt: -1 });
};

battleSchema.statics.getUserBattles = function (userId) {
  return this.find({
    $or: [{ creatorId: userId }, { opponentId: userId }],
  }).sort({ createdAt: -1 });
};

battleSchema.statics.getBattlesByType = function (battleType, limit = 20) {
  return this.find({
    battleType,
    status: { $in: ["active", "completed"] },
  })
    .limit(limit)
    .sort({ createdAt: -1 });
};

// Pre-save middleware
battleSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-start battle if both participants have set baselines
  if (
    this.status === "pending" &&
    this.creatorProgress.baseline !== null &&
    this.opponentProgress.baseline !== null
  ) {
    this.startBattle();
  }

  // Auto-complete battle if duration has passed
  if (this.status === "active" && this.endDate && new Date() > this.endDate) {
    this.completeBattle();
  }

  next();
});

const Battle = mongoose.model("Battle", battleSchema);

module.exports = Battle;
