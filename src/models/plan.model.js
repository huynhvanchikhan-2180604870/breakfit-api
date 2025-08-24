const mongoose = require("mongoose");

/**
 * 30-day plan model for tracking daily workout completion
 * Each user has 30 days (0-29) with workout presets
 */
const planSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dayIndex: {
      type: Number,
      required: [true, "Chỉ số ngày là bắt buộc"],
      min: [0, "Chỉ số ngày phải từ 0 trở lên"],
      max: [29, "Chỉ số ngày không được quá 29"],
    },
    preset: {
      type: String,
      enum: ["A", "B", "C", "rest", "cardio"],
      required: [true, "Preset workout là bắt buộc"],
    },
    workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    completionTime: {
      minutes: Number,
      seconds: Number,
    },
    actualKcal: Number,
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard", "extreme"],
      default: "moderate",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Ghi chú không được quá 500 ký tự"],
    },
    skipped: {
      type: Boolean,
      default: false,
    },
    skippedReason: {
      type: String,
      enum: ["injury", "sick", "busy", "tired", "other"],
      default: "other",
    },
    skippedNote: String,
    mood: {
      type: String,
      enum: ["terrible", "bad", "okay", "good", "great", "amazing"],
      default: "okay",
    },
    energy: {
      type: String,
      enum: ["very_low", "low", "medium", "high", "very_high"],
      default: "medium",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure unique plan per user per day
planSchema.index({ userId: 1, dayIndex: 1 }, { unique: true });

// Indexes
planSchema.index({ userId: 1, isCompleted: 1 });
planSchema.index({ userId: 1, preset: 1 });

// Virtuals
planSchema.virtual("dayNumber").get(function () {
  return this.dayIndex + 1;
});

planSchema.virtual("isRestDay").get(function () {
  return this.preset === "rest";
});

planSchema.virtual("completionTimeMinutes").get(function () {
  if (!this.completionTime) return 0;
  return this.completionTime.minutes + this.completionTime.seconds / 60;
});

// Instance methods
planSchema.methods = {
  /**
   * Mark plan as completed
   */
  markCompleted(workoutId = null, completionData = {}) {
    this.isCompleted = true;
    this.completedAt = new Date();
    this.workoutId = workoutId;

    if (completionData.completionTime) {
      this.completionTime = completionData.completionTime;
    }
    if (completionData.actualKcal) {
      this.actualKcal = completionData.actualKcal;
    }
    if (completionData.difficulty) {
      this.difficulty = completionData.difficulty;
    }
    if (completionData.mood) {
      this.mood = completionData.mood;
    }
    if (completionData.energy) {
      this.energy = completionData.energy;
    }
    if (completionData.notes) {
      this.notes = completionData.notes;
    }
  },

  /**
   * Mark plan as skipped
   */
  markSkipped(reason, note = "") {
    this.skipped = true;
    this.skippedReason = reason;
    this.skippedNote = note;
    this.isCompleted = false;
  },

  /**
   * Get next day plan
   */
  async getNextDayPlan() {
    if (this.dayIndex >= 29) return null;

    return this.constructor.findOne({
      userId: this.userId,
      dayIndex: this.dayIndex + 1,
    });
  },

  /**
   * Get previous day plan
   */
  async getPreviousDayPlan() {
    if (this.dayIndex <= 0) return null;

    return this.constructor.findOne({
      userId: this.userId,
      dayIndex: this.dayIndex - 1,
    });
  },
};

// Static methods
planSchema.statics = {
  /**
   * Create 30-day plan for user
   */
  async createUserPlan(userId, presetPattern = ["A", "B", "C"]) {
    const plans = [];

    for (let day = 0; day < 30; day++) {
      const preset = presetPattern[day % presetPattern.length];
      plans.push({
        userId,
        dayIndex: day,
        preset,
      });
    }

    return this.insertMany(plans);
  },

  /**
   * Get plan progress for user
   */
  async getPlanProgress(userId) {
    const result = await this.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          completedDays: { $sum: { $cond: ["$isCompleted", 1, 0] } },
          skippedDays: { $sum: { $cond: ["$skipped", 1, 0] } },
          completionRate: {
            $multiply: [
              {
                $divide: [
                  { $sum: { $cond: ["$isCompleted", 1, 0] } },
                  { $sum: 1 },
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    return result[0] || null;
  },

  /**
   * Get streak information
   */
  async getStreakInfo(userId) {
    const plans = await this.find({ userId }).sort({ dayIndex: -1 }).limit(30);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (const plan of plans) {
      if (plan.isCompleted) {
        tempStreak++;
        currentStreak = Math.max(currentStreak, tempStreak);
      } else if (plan.skipped) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      } else {
        break;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalCompleted: plans.filter((p) => p.isCompleted).length,
      totalSkipped: plans.filter((p) => p.skipped).length,
    };
  },
};

module.exports = mongoose.model("Plan", planSchema);
