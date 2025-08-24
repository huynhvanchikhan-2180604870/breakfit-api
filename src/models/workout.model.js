const mongoose = require("mongoose");

/**
 * Workout tracking model for exercise sessions
 * Supports different workout types and photo documentation
 */
const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateISO: {
      type: String,
      required: [true, "Ngày là bắt buộc"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày phải là YYYY-MM-DD"],
      index: true,
    },
    type: {
      type: String,
      enum: ["A", "B", "C", "cardio", "strength", "flexibility", "sports"],
      required: [true, "Loại workout là bắt buộc"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [200, "Tên workout không được quá 200 ký tự"],
    },
    duration: {
      minutes: {
        type: Number,
        required: [true, "Thời gian là bắt buộc"],
        min: [1, "Thời gian phải từ 1 phút trở lên"],
        max: [480, "Thời gian không được quá 8 giờ"],
      },
      seconds: {
        type: Number,
        default: 0,
        min: [0, "Giây không được âm"],
        max: [59, "Giây không được quá 59"],
      },
    },
    kcal: {
      type: Number,
      required: [true, "Calories đốt cháy là bắt buộc"],
      min: [0, "Calories không được âm"],
    },
    intensity: {
      type: String,
      enum: ["low", "moderate", "high", "extreme"],
      default: "moderate",
    },
    heartRate: {
      average: {
        type: Number,
        min: [40, "Nhịp tim trung bình phải từ 40 trở lên"],
        max: [220, "Nhịp tim trung bình không được quá 220"],
      },
      max: {
        type: Number,
        min: [40, "Nhịp tim tối đa phải từ 40 trở lên"],
        max: [220, "Nhịp tim tối đa không được quá 220"],
      },
    },
    exercises: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        sets: [
          {
            reps: Number,
            weight: Number,
            duration: Number, // seconds
            distance: Number, // meters
            restTime: Number, // seconds
          },
        ],
        notes: String,
      },
    ],
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Ghi chú không được quá 500 ký tự"],
    },
    photoIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photo",
      },
    ],
    isCompleted: {
      type: Boolean,
      default: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard", "extreme"],
      default: "moderate",
    },
    mood: {
      type: String,
      enum: ["terrible", "bad", "okay", "good", "great", "amazing"],
      default: "okay",
    },
    source: {
      type: String,
      enum: ["manual", "app", "device"],
      default: "manual",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
workoutSchema.index({ userId: 1, dateISO: 1 });
workoutSchema.index({ userId: 1, type: 1 });
workoutSchema.index({ userId: 1, intensity: 1 });

// Virtuals
workoutSchema.virtual("totalDurationMinutes").get(function () {
  return this.duration.minutes + this.duration.seconds / 60;
});

workoutSchema.virtual("kcalPerMinute").get(function () {
  if (this.totalDurationMinutes === 0) return 0;
  return (this.kcal / this.totalDurationMinutes).toFixed(1);
});

workoutSchema.virtual("totalSets").get(function () {
  return this.exercises.reduce((total, exercise) => {
    return total + (exercise.sets ? exercise.sets.length : 0);
  }, 0);
});

// Instance methods
workoutSchema.methods = {
  /**
   * Calculate estimated calories burned
   */
  calculateEstimatedCalories(profile) {
    // Basic calculation based on weight and duration
    const weightKg = profile.currentWeightKg;
    const durationHours = this.totalDurationMinutes / 60;

    // MET values for different workout types
    const metValues = {
      A: 6,
      B: 7,
      C: 8,
      cardio: 8,
      strength: 5,
      flexibility: 2.5,
      sports: 7,
    };

    const met = metValues[this.type] || 5;
    this.kcal = Math.round(met * weightKg * durationHours);

    return this.kcal;
  },

  /**
   * Get workout intensity based on heart rate
   */
  getIntensityFromHeartRate() {
    if (!this.heartRate.average) return this.intensity;

    const maxHR = 220 - 25; // Simplified max HR calculation
    const percentage = (this.heartRate.average / maxHR) * 100;

    if (percentage < 50) return "low";
    if (percentage < 70) return "moderate";
    if (percentage < 85) return "high";
    return "extreme";
  },
};

// Static methods
workoutSchema.statics = {
  /**
   * Get workout statistics for user
   */
  async getWorkoutStats(userId, startDate, endDate) {
    return this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          dateISO: { $gte: startDate, $lte: endDate },
          isCompleted: true,
        },
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: "$duration.minutes" },
          totalKcal: { $sum: "$kcal" },
          avgDuration: { $avg: "$duration.minutes" },
          avgKcal: { $avg: "$kcal" },
        },
      },
    ]);
  },

  /**
   * Get workout type distribution
   */
  async getWorkoutTypeDistribution(userId, startDate, endDate) {
    return this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          dateISO: { $gte: startDate, $lte: endDate },
          isCompleted: true,
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalDuration: { $sum: "$duration.minutes" },
          totalKcal: { $sum: "$kcal" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  },
};

module.exports = mongoose.model("Workout", workoutSchema);
