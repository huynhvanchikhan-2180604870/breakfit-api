const mongoose = require("mongoose");
const logger = require("../utils/logger.util");

/**
 * AI Coach Schema
 * Handles personalized AI coaching sessions and recommendations
 */
const aiCoachSchema = new mongoose.Schema(
  {
    // User association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Coach Profile
    coachName: {
      type: String,
      default: "Coach AI",
    },
    coachPersonality: {
      type: String,
      enum: ["motivational", "strict", "friendly", "professional", "casual"],
      default: "motivational",
    },
    coachStyle: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "beginner",
    },

    // User Goals & Preferences
    userGoals: [
      {
        type: String,
        enum: [
          "weight_loss",
          "muscle_gain",
          "endurance",
          "strength",
          "flexibility",
          "general_fitness",
          "sports_performance",
          "recovery",
        ],
        required: true,
      },
    ],
    fitnessLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    preferredWorkoutTypes: [
      {
        type: String,
        enum: [
          "cardio",
          "strength",
          "flexibility",
          "hiit",
          "yoga",
          "pilates",
          "sports",
          "functional",
        ],
      },
    ],
    timeAvailability: {
      type: String,
      enum: ["15min", "30min", "45min", "60min", "90min", "120min"],
      default: "30min",
    },
    equipmentAccess: [
      {
        type: String,
        enum: [
          "none",
          "dumbbells",
          "resistance_bands",
          "pull_up_bar",
          "bench",
          "full_gym",
        ],
      },
    ],

    // AI Learning & Adaptation
    userResponses: [
      {
        question: String,
        answer: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        context: String, // workout, nutrition, motivation, etc.
      },
    ],
    adaptationHistory: [
      {
        date: Date,
        changes: [
          {
            field: String,
            oldValue: mongoose.Schema.Types.Mixed,
            newValue: mongoose.Schema.Types.Mixed,
            reason: String,
          },
        ],
        trigger: String, // user_feedback, performance, goal_change
      },
    ],
    learningProgress: {
      totalSessions: { type: Number, default: 0 },
      successfulRecommendations: { type: Number, default: 0 },
      userSatisfaction: { type: Number, default: 0 }, // 0-100
      lastLearningUpdate: Date,
    },

    // Current Coaching Session
    activeSession: {
      sessionId: String,
      startTime: Date,
      sessionType: {
        type: String,
        enum: ["workout", "nutrition", "motivation", "assessment"],
      },
      currentStep: Number,
      totalSteps: Number,
      userFeedback: [
        {
          step: Number,
          rating: { type: Number, min: 1, max: 5 },
          comment: String,
          timestamp: Date,
        },
      ],
    },

    // Coaching History
    coachingSessions: [
      {
        sessionId: String,
        date: Date,
        type: {
          type: String,
          enum: ["workout", "nutrition", "motivation", "assessment"],
        },
        duration: Number, // minutes
        topics: [String],
        recommendations: [
          {
            category: String,
            content: String,
            priority: {
              type: String,
              enum: ["low", "medium", "high", "urgent"],
            },
            followUp: Date,
          },
        ],
        userSatisfaction: Number, // 1-5
        effectiveness: Number, // 0-100
        notes: String,
      },
    ],

    // Personalized Content
    workoutTemplates: [
      {
        name: String,
        description: String,
        difficulty: String,
        duration: Number,
        exercises: [
          {
            name: String,
            sets: Number,
            reps: Number,
            rest: Number,
            notes: String,
          },
        ],
        tags: [String],
        lastUsed: Date,
        successRate: Number, // 0-100
      },
    ],
    nutritionGuidelines: [
      {
        category: String, // breakfast, lunch, dinner, snacks
        recommendations: [String],
        restrictions: [String],
        alternatives: [String],
        lastUpdated: Date,
      },
    ],
    motivationalContent: [
      {
        type: {
          type: String,
          enum: ["quote", "story", "tip", "challenge"],
        },
        content: String,
        context: String,
        effectiveness: Number, // 0-100
        lastUsed: Date,
      },
    ],

    // AI Model Configuration
    aiModelVersion: String,
    lastModelUpdate: Date,
    modelParameters: {
      learningRate: Number,
      adaptationThreshold: Number,
      personalizationWeight: Number,
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
aiCoachSchema.index({ userId: 1 });
aiCoachSchema.index({ "coachingSessions.date": -1 });
aiCoachSchema.index({ userGoals: 1 });
aiCoachSchema.index({ fitnessLevel: 1 });

// Virtual fields
aiCoachSchema.virtual("isActive").get(function () {
  return this.activeSession && this.activeSession.sessionId;
});

aiCoachSchema.virtual("coachingExperience").get(function () {
  return this.coachingSessions.length;
});

aiCoachSchema.virtual("averageSatisfaction").get(function () {
  if (this.coachingSessions.length === 0) return 0;
  const total = this.coachingSessions.reduce(
    (sum, session) => sum + (session.userSatisfaction || 0),
    0
  );
  return Math.round(total / this.coachingSessions.length);
});

aiCoachSchema.virtual("successRate").get(function () {
  if (this.coachingSessions.length === 0) return 0;
  const successful = this.coachingSessions.filter(
    (session) => session.effectiveness >= 70
  ).length;
  return Math.round((successful / this.coachingSessions.length) * 100);
});

// Instance methods
aiCoachSchema.methods.startSession = function (sessionType, totalSteps = 5) {
  if (this.activeSession && this.activeSession.sessionId) {
    throw new Error("Another session is already active");
  }

  this.activeSession = {
    sessionId: `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    startTime: new Date(),
    sessionType,
    currentStep: 1,
    totalSteps,
    userFeedback: [],
  };

  return this;
};

aiCoachSchema.methods.nextStep = function () {
  if (!this.activeSession) {
    throw new Error("No active session");
  }

  if (this.activeSession.currentStep < this.activeSession.totalSteps) {
    this.activeSession.currentStep++;
    return this.activeSession.currentStep;
  }

  return null; // Session completed
};

aiCoachSchema.methods.addFeedback = function (step, rating, comment = "") {
  if (!this.activeSession) {
    throw new Error("No active session");
  }

  this.activeSession.userFeedback.push({
    step,
    rating,
    comment,
    timestamp: new Date(),
  });

  return this;
};

aiCoachSchema.methods.completeSession = function (
  topics,
  recommendations,
  notes = ""
) {
  if (!this.activeSession) {
    throw new Error("No active session");
  }

  const session = {
    sessionId: this.activeSession.sessionId,
    date: this.activeSession.startTime,
    type: this.activeSession.sessionType,
    duration: Math.round(
      (new Date() - this.activeSession.startTime) / (1000 * 60)
    ),
    topics,
    recommendations,
    userSatisfaction: this.calculateSessionSatisfaction(),
    effectiveness: this.calculateSessionEffectiveness(),
    notes,
  };

  this.coachingSessions.push(session);
  this.activeSession = null;
  this.learningProgress.totalSessions++;

  return session;
};

aiCoachSchema.methods.calculateSessionSatisfaction = function () {
  if (!this.activeSession || this.activeSession.userFeedback.length === 0) {
    return 0;
  }

  const totalRating = this.activeSession.userFeedback.reduce(
    (sum, feedback) => sum + feedback.rating,
    0
  );
  return Math.round(totalRating / this.activeSession.userFeedback.length);
};

aiCoachSchema.methods.calculateSessionEffectiveness = function () {
  // Simple effectiveness calculation based on user satisfaction and completion
  const satisfaction = this.calculateSessionSatisfaction();
  const completionRate =
    this.activeSession.currentStep / this.activeSession.totalSteps;

  return Math.round(satisfaction * 0.7 + completionRate * 100 * 0.3);
};

aiCoachSchema.methods.adaptToUser = function (trigger, changes) {
  const adaptation = {
    date: new Date(),
    changes,
    trigger,
  };

  this.adaptationHistory.push(adaptation);

  // Update learning progress
  this.learningProgress.lastLearningUpdate = new Date();

  return this;
};

aiCoachSchema.methods.addUserResponse = function (question, answer, context) {
  this.userResponses.push({
    question,
    answer,
    context,
    timestamp: new Date(),
  });

  return this;
};

// Static methods
aiCoachSchema.statics.findByUserGoals = function (goals, limit = 10) {
  return this.find({
    userGoals: { $in: goals },
  })
    .limit(limit)
    .sort({ "learningProgress.userSatisfaction": -1 });
};

aiCoachSchema.statics.findByFitnessLevel = function (level, limit = 10) {
  return this.find({ fitnessLevel: level })
    .limit(limit)
    .sort({ "learningProgress.userSatisfaction": -1 });
};

// Pre-save middleware
aiCoachSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const AICoach = mongoose.model("AICoach", aiCoachSchema);

module.exports = AICoach;
