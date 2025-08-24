const mongoose = require("mongoose");

/**
 * Meal tracking model for food intake and nutrition
 * Supports photo attachments and detailed macro tracking
 */
const mealSchema = new mongoose.Schema(
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
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: [true, "Loại bữa ăn là bắt buộc"],
    },
    name: {
      type: String,
      required: [true, "Tên món ăn là bắt buộc"],
      trim: true,
      maxlength: [200, "Tên món ăn không được quá 200 ký tự"],
    },
    grams: {
      type: Number,
      required: [true, "Khối lượng là bắt buộc"],
      min: [1, "Khối lượng phải từ 1g trở lên"],
    },
    kcal: {
      type: Number,
      required: [true, "Calories là bắt buộc"],
      min: [0, "Calories không được âm"],
    },
    protein: {
      type: Number,
      required: [true, "Protein là bắt buộc"],
      min: [0, "Protein không được âm"],
    },
    carb: {
      type: Number,
      default: 0,
      min: [0, "Carb không được âm"],
    },
    fat: {
      type: Number,
      default: 0,
      min: [0, "Fat không được âm"],
    },
    fiber: {
      type: Number,
      default: 0,
      min: [0, "Fiber không được âm"],
    },
    sugar: {
      type: Number,
      default: 0,
      min: [0, "Sugar không được âm"],
    },
    sodium: {
      type: Number,
      default: 0,
      min: [0, "Sodium không được âm"],
    },
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ["manual", "ai_analysis", "barcode", "app"],
      default: "manual",
    },
    confidence: {
      type: Number,
      min: [0, "Độ tin cậy phải từ 0 trở lên"],
      max: [1, "Độ tin cậy không được quá 1"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
mealSchema.index({ userId: 1, dateISO: 1 });
mealSchema.index({ userId: 1, mealType: 1 });
mealSchema.index({ userId: 1, source: 1 });

// Virtuals
mealSchema.virtual("totalMacros").get(function () {
  return this.protein + this.carb + this.fat;
});

mealSchema.virtual("proteinPercent").get(function () {
  if (this.totalMacros === 0) return 0;
  return ((this.protein / this.totalMacros) * 100).toFixed(1);
});

mealSchema.virtual("carbPercent").get(function () {
  if (this.totalMacros === 0) return 0;
  return ((this.carb / this.totalMacros) * 100).toFixed(1);
});

mealSchema.virtual("fatPercent").get(function () {
  if (this.totalMacros === 0) return 0;
  return ((this.fat / this.totalMacros) * 100).toFixed(1);
});

// Instance methods
mealSchema.methods = {
  /**
   * Calculate calories from macros
   */
  calculateCalories() {
    this.kcal = this.protein * 4 + this.carb * 4 + this.fat * 9;
    return this.kcal;
  },

  /**
   * Check if meal meets macro targets
   */
  checkMacroTargets(profile) {
    const targets = {
      protein: profile.proteinTarget || 120,
      carb: profile.carbTarget || 150,
      fat: profile.fatTarget || 50,
    };

    return {
      protein: this.protein >= targets.protein * 0.8, // 80% of target
      carb: this.carb >= targets.carb * 0.8,
      fat: this.fat >= targets.fat * 0.8,
    };
  },
};

// Static methods
mealSchema.statics = {
  /**
   * Get daily nutrition summary
   */
  async getDailyNutrition(userId, dateISO) {
    const result = await this.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId), dateISO },
      },
      {
        $group: {
          _id: null,
          totalKcal: { $sum: "$kcal" },
          totalProtein: { $sum: "$protein" },
          totalCarb: { $sum: "$carb" },
          totalFat: { $sum: "$fat" },
          totalFiber: { $sum: "$fiber" },
          mealCount: { $sum: 1 },
        },
      },
    ]);

    return result[0] || null;
  },

  /**
   * Get meal type distribution
   */
  async getMealTypeDistribution(userId, startDate, endDate) {
    return this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          dateISO: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$mealType",
          count: { $sum: 1 },
          avgKcal: { $avg: "$kcal" },
          totalKcal: { $sum: "$kcal" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  },
};

module.exports = mongoose.model("Meal", mealSchema);
