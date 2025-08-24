const mongoose = require("mongoose");
const logger = require("../utils/logger.util");

/**
 * Challenge Schema
 * Handles fitness challenges with rules, participants, and leaderboards
 */
const challengeSchema = new mongoose.Schema(
  {
    // Basic Info
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
    category: {
      type: String,
      enum: [
        "weight_loss",
        "muscle_gain",
        "endurance",
        "strength",
        "nutrition",
        "general",
      ],
      default: "general",
    },

    // Challenge Configuration
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
    },
    startMode: {
      type: String,
      enum: ["fixed", "rolling"],
      default: "rolling",
    },
    startDate: {
      type: Date,
      required: function () {
        return this.startMode === "fixed";
      },
    },
    endDate: {
      type: Date,
      required: function () {
        return this.startMode === "fixed";
      },
    },

    // Rules & Requirements
    rules: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    requirements: {
      minParticipants: {
        type: Number,
        default: 2,
        min: 1,
      },
      maxParticipants: {
        type: Number,
        default: 1000,
        min: 1,
      },
      ageRange: {
        min: { type: Number, min: 13, max: 120 },
        max: { type: Number, min: 13, max: 120 },
      },
      fitnessLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "any"],
        default: "any",
      },
    },

    // Rewards & Prizes
    prizes: [
      {
        type: {
          type: String,
          enum: ["xp", "badge", "title", "real_prize"],
          required: true,
        },
        value: mongoose.Schema.Types.Mixed,
        description: String,
        rank: Number, // For ranking-based prizes
      },
    ],

    // Status & Management
    status: {
      type: String,
      enum: ["draft", "open", "active", "completed", "cancelled"],
      default: "draft",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Creator Info
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorName: String,

    // Participants
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        startDate: Date,
        endDate: Date,
        progress: {
          currentDay: { type: Number, default: 0 },
          completedDays: { type: Number, default: 0 },
          totalScore: { type: Number, default: 0 },
          streakDays: { type: Number, default: 0 },
          lastActivity: Date,
        },
        status: {
          type: String,
          enum: ["active", "completed", "dropped", "disqualified"],
          default: "active",
        },
        achievements: [
          {
            type: String,
            earnedAt: Date,
          },
        ],
      },
    ],

    // Challenge Progress
    currentDay: {
      type: Number,
      default: 0,
    },
    totalParticipants: {
      type: Number,
      default: 0,
    },
    activeParticipants: {
      type: Number,
      default: 0,
    },

    // Metrics & Analytics
    metrics: {
      totalXP: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      topScore: { type: Number, default: 0 },
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
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
challengeSchema.index({ status: 1, startDate: 1 });
challengeSchema.index({ category: 1, isPublic: 1 });
challengeSchema.index({ "participants.userId": 1 });
challengeSchema.index({ creatorId: 1 });
challengeSchema.index({ isFeatured: 1, createdAt: -1 });

// Virtual fields
challengeSchema.virtual("isActive").get(function () {
  if (this.status !== "active") return false;
  if (this.startMode === "fixed") {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }
  return true;
});

challengeSchema.virtual("daysRemaining").get(function () {
  if (this.status !== "active") return 0;
  if (this.startMode === "fixed") {
    const now = new Date();
    if (now > this.endDate) return 0;
    return Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24));
  }
  return Math.max(0, this.durationDays - this.currentDay);
});

challengeSchema.virtual("completionPercentage").get(function () {
  if (this.status !== "active") return 100;
  return Math.min(100, (this.currentDay / this.durationDays) * 100);
});

// Instance methods
challengeSchema.methods.canUserJoin = function (user, userProfile) {
  // Check if challenge is open
  if (this.status !== "open" && this.status !== "active") {
    return { canJoin: false, reason: "Challenge is not open for joining" };
  }

  // Check if user is already a participant
  const existingParticipant = this.participants.find((p) =>
    p.userId.equals(user._id)
  );
  if (existingParticipant) {
    return { canJoin: false, reason: "User is already a participant" };
  }

  // Check participant limits
  if (this.totalParticipants >= this.requirements.maxParticipants) {
    return { canJoin: false, reason: "Challenge is full" };
  }

  // Check age requirements
  if (this.requirements.ageRange) {
    const userAge = new Date().getFullYear() - userProfile.birthYear;
    if (
      userAge < this.requirements.ageRange.min ||
      userAge > this.requirements.ageRange.max
    ) {
      return { canJoin: false, reason: "User age does not meet requirements" };
    }
  }

  // Check fitness level
  if (
    this.requirements.fitnessLevel !== "any" &&
    userProfile.fitnessLevel !== this.requirements.fitnessLevel
  ) {
    return {
      canJoin: false,
      reason: "User fitness level does not meet requirements",
    };
  }

  return { canJoin: true };
};

challengeSchema.methods.addParticipant = function (userId, userProfile) {
  const canJoin = this.canUserJoin({ _id: userId }, userProfile);
  if (!canJoin.canJoin) {
    throw new Error(canJoin.reason);
  }

  const participant = {
    userId,
    joinedAt: new Date(),
    startDate: this.startMode === "rolling" ? new Date() : this.startDate,
    endDate:
      this.startMode === "rolling"
        ? new Date(Date.now() + this.durationDays * 24 * 60 * 60 * 1000)
        : this.endDate,
    progress: {
      currentDay: 0,
      completedDays: 0,
      totalScore: 0,
      streakDays: 0,
      lastActivity: new Date(),
    },
    status: "active",
    achievements: [],
  };

  this.participants.push(participant);
  this.totalParticipants++;
  this.activeParticipants++;

  return participant;
};

challengeSchema.methods.removeParticipant = function (userId) {
  const participantIndex = this.participants.findIndex((p) =>
    p.userId.equals(userId)
  );
  if (participantIndex === -1) {
    throw new Error("User is not a participant");
  }

  const participant = this.participants[participantIndex];
  if (participant.status === "active") {
    this.activeParticipants--;
  }

  this.participants.splice(participantIndex, 1);
  this.totalParticipants--;

  return participant;
};

challengeSchema.methods.updateParticipantProgress = function (
  userId,
  dayNumber,
  score,
  completed = true
) {
  const participant = this.participants.find((p) => p.userId.equals(userId));
  if (!participant) {
    throw new Error("User is not a participant");
  }

  if (participant.status !== "active") {
    throw new Error("Participant is not active");
  }

  // Update progress
  participant.progress.currentDay = Math.max(
    participant.progress.currentDay,
    dayNumber
  );
  if (completed) {
    participant.progress.completedDays++;
    participant.progress.totalScore += score;

    // Update streak
    const lastActivity = new Date(participant.progress.lastActivity);
    const today = new Date();
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) {
      participant.progress.streakDays++;
    } else {
      participant.progress.streakDays = 1;
    }

    participant.progress.lastActivity = today;
  }

  // Check if participant completed the challenge
  if (participant.progress.completedDays >= this.durationDays) {
    participant.status = "completed";
    this.activeParticipants--;
  }

  return participant;
};

challengeSchema.methods.getLeaderboard = function (limit = 50) {
  return this.participants
    .filter((p) => p.status === "active" || p.status === "completed")
    .sort((a, b) => {
      // Sort by completion percentage first
      const aCompletion = (a.progress.completedDays / this.durationDays) * 100;
      const bCompletion = (b.progress.completedDays / this.durationDays) * 100;

      if (aCompletion !== bCompletion) {
        return bCompletion - aCompletion;
      }

      // Then by total score
      return b.progress.totalScore - a.progress.totalScore;
    })
    .slice(0, limit)
    .map((participant, index) => ({
      rank: index + 1,
      userId: participant.userId,
      completedDays: participant.progress.completedDays,
      totalScore: participant.progress.totalScore,
      streakDays: participant.progress.streakDays,
      completionPercentage:
        (participant.progress.completedDays / this.durationDays) * 100,
      status: participant.status,
    }));
};

// Static methods
challengeSchema.statics.getActiveChallenges = function () {
  return this.find({ status: "active" }).sort({ createdAt: -1 });
};

challengeSchema.statics.getOpenChallenges = function () {
  return this.find({ status: "open" }).sort({ createdAt: -1 });
};

challengeSchema.statics.getUpcomingChallenges = function () {
  return this.find({
    status: "open",
    startDate: { $gt: new Date() },
  }).sort({ startDate: 1 });
};

challengeSchema.statics.getChallengesByCategory = function (
  category,
  limit = 20
) {
  return this.find({
    category,
    isPublic: true,
    status: { $in: ["open", "active"] },
  })
    .limit(limit)
    .sort({ createdAt: -1 });
};

challengeSchema.statics.getFeaturedChallenges = function (limit = 10) {
  return this.find({
    isFeatured: true,
    status: { $in: ["open", "active"] },
  })
    .limit(limit)
    .sort({ createdAt: -1 });
};

challengeSchema.statics.getUserChallenges = function (userId) {
  return this.find({
    "participants.userId": userId,
  }).sort({ createdAt: -1 });
};

// Pre-save middleware
challengeSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-start challenge if conditions are met
  if (
    this.status === "open" &&
    this.startMode === "rolling" &&
    this.totalParticipants >= this.requirements.minParticipants
  ) {
    this.status = "active";
    this.startedAt = new Date();
    this.currentDay = 0;
  }

  next();
});

// Pre-remove middleware
challengeSchema.pre("remove", function (next) {
  // Clean up related data
  logger.info(`Challenge ${this._id} is being removed`);
  next();
});

const Challenge = mongoose.model("Challenge", challengeSchema);

module.exports = Challenge;
