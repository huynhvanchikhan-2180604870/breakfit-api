const mongoose = require("mongoose");

/**
 * Weight tracking model for daily weight measurements
 * Ensures unique weight entry per user per day
 */
const weightSchema = new mongoose.Schema(
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
    weightKg: {
      type: Number,
      required: [true, "Cân nặng là bắt buộc"],
      min: [30, "Cân nặng phải từ 30kg trở lên"],
      max: [300, "Cân nặng không được quá 300kg"],
    },
    bodyFatPercent: {
      type: Number,
      min: [5, "Tỷ lệ mỡ phải từ 5% trở lên"],
      max: [50, "Tỷ lệ mỡ không được quá 50%"],
    },
    muscleMassKg: {
      type: Number,
      min: [10, "Khối lượng cơ phải từ 10kg trở lên"],
      max: [150, "Khối lượng cơ không được quá 150kg"],
    },
    waterPercent: {
      type: Number,
      min: [40, "Tỷ lệ nước phải từ 40% trở lên"],
      max: [70, "Tỷ lệ nước không được quá 70%"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Ghi chú không được quá 500 ký tự"],
    },
    source: {
      type: String,
      enum: ["manual", "scale", "app"],
      default: "manual",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure unique weight per user per day
weightSchema.index({ userId: 1, dateISO: 1 }, { unique: true });

// Virtuals
weightSchema.virtual("weightLbs").get(function () {
  return (this.weightKg * 2.20462).toFixed(1);
});

weightSchema.virtual("weightDiffKg").get(function () {
  // This will be calculated when comparing with previous weight
  return null;
});

// Instance methods
weightSchema.methods = {
  /**
   * Get weight difference from previous measurement
   */
  async getWeightDifference() {
    const previousWeight = await this.constructor
      .findOne({ userId: this.userId, dateISO: { $lt: this.dateISO } })
      .sort({ dateISO: -1 });

    if (previousWeight) {
      return {
        diffKg: this.weightKg - previousWeight.weightKg,
        diffPercent: (
          ((this.weightKg - previousWeight.weightKg) /
            previousWeight.weightKg) *
          100
        ).toFixed(1),
        daysSince: Math.floor(
          (new Date(this.dateISO) - new Date(previousWeight.dateISO)) /
            (1000 * 60 * 60 * 24)
        ),
      };
    }
    return null;
  },

  /**
   * Check if weight is within healthy range
   */
  isHealthyWeight() {
    // Basic BMI check (simplified)
    return this.weightKg >= 30 && this.weightKg <= 300;
  },
};

// Static methods
weightSchema.statics = {
  /**
   * Get weight trend for user
   */
  async getWeightTrend(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
      userId,
      dateISO: { $gte: startDate.toISOString().split("T")[0] },
    }).sort({ dateISO: 1 });
  },

  /**
   * Get average weight for period
   */
  async getAverageWeight(userId, startDate, endDate) {
    const result = await this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          dateISO: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          avgWeight: { $avg: "$weightKg" },
          minWeight: { $min: "$weightKg" },
          maxWeight: { $max: "$weightKg" },
          count: { $sum: 1 },
        },
      },
    ]);

    return result[0] || null;
  },
};

module.exports = mongoose.model("Weight", weightSchema);
