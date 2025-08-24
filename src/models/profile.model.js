const mongoose = require("mongoose");

/**
 * User profile model containing fitness and health data
 * Automatically calculates TDEE using Mifflin-St Jeor formula
 */
const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    sex: {
      type: String,
      enum: {
        values: ["male", "female"],
        message: "Giới tính phải là 'male' hoặc 'female'",
      },
      required: [true, "Giới tính là bắt buộc"],
    },
    heightCm: {
      type: Number,
      required: [true, "Chiều cao là bắt buộc"],
      min: [100, "Chiều cao phải từ 100cm trở lên"],
      max: [250, "Chiều cao không được quá 250cm"],
    },
    startWeightKg: {
      type: Number,
      required: [true, "Cân nặng ban đầu là bắt buộc"],
      min: [30, "Cân nặng phải từ 30kg trở lên"],
      max: [300, "Cân nặng không được quá 300kg"],
    },
    currentWeightKg: {
      type: Number,
      required: [true, "Cân nặng hiện tại là bắt buộc"],
      min: [30, "Cân nặng phải từ 30kg trở lên"],
      max: [300, "Cân nặng không được quá 300kg"],
    },
    targetWeightKg: {
      type: Number,
      min: [30, "Cân nặng mục tiêu phải từ 30kg trở lên"],
      max: [300, "Cân nặng mục tiêu không được quá 300kg"],
    },
    birthYear: {
      type: Number,
      required: [true, "Năm sinh là bắt buộc"],
      min: [1900, "Năm sinh phải từ 1900 trở lên"],
      max: [new Date().getFullYear(), "Năm sinh không được trong tương lai"],
    },
    activity: {
      type: String,
      enum: {
        values: ["sedentary", "light", "moderate", "active", "athlete"],
        message: "Mức độ hoạt động không hợp lệ",
      },
      required: [true, "Mức độ hoạt động là bắt buộc"],
    },
    tdee: {
      type: Number,
      required: true,
    },
    kcalTarget: {
      type: Number,
      required: true,
    },
    proteinTarget: {
      type: Number,
      default: 120,
      min: [50, "Protein mục tiêu phải từ 50g trở lên"],
      max: [300, "Protein mục tiêu không được quá 300g"],
    },
    carbTarget: {
      type: Number,
      min: [50, "Carb mục tiêu phải từ 50g trở lên"],
      max: [500, "Carb mục tiêu không được quá 500g"],
    },
    fatTarget: {
      type: Number,
      min: [20, "Fat mục tiêu phải từ 20g trở lên"],
      max: [150, "Fat mục tiêu không được quá 150g"],
    },
    goal: {
      type: String,
      enum: ["lose", "maintain", "gain"],
      default: "lose",
    },
    weeklyGoalKg: {
      type: Number,
      default: -0.5, // -0.5kg per week for weight loss
      min: [-2, "Mục tiêu giảm cân không được quá 2kg/tuần"],
      max: [1, "Mục tiêu tăng cân không được quá 1kg/tuần"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
profileSchema.index({ userId: 1 });
profileSchema.index({ goal: 1 });
profileSchema.index({ activity: 1 });

// Virtuals
profileSchema.virtual("age").get(function () {
  return new Date().getFullYear() - this.birthYear;
});

profileSchema.virtual("bmi").get(function () {
  const heightM = this.heightCm / 100;
  return (this.currentWeightKg / (heightM * heightM)).toFixed(1);
});

profileSchema.virtual("weightDiffKg").get(function () {
  return this.currentWeightKg - this.startWeightKg;
});

profileSchema.virtual("weightDiffPercent").get(function () {
  return ((this.weightDiffKg / this.startWeightKg) * 100).toFixed(1);
});

// Pre-save middleware
profileSchema.pre("save", function (next) {
  // Calculate TDEE if required fields are present
  if (
    this.sex &&
    this.heightCm &&
    this.currentWeightKg &&
    this.birthYear &&
    this.activity
  ) {
    this.calculateTDEE();
  }
  next();
});

// Instance methods
profileSchema.methods = {
  /**
   * Calculate TDEE using Mifflin-St Jeor formula
   */
  calculateTDEE() {
    let bmr;

    // Calculate BMR using Mifflin-St Jeor formula
    if (this.sex === "male") {
      bmr = 10 * this.currentWeightKg + 6.25 * this.heightCm - 5 * this.age + 5;
    } else {
      bmr =
        10 * this.currentWeightKg + 6.25 * this.heightCm - 5 * this.age - 161;
    }

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      active: 1.725, // Hard exercise 6-7 days/week
      athlete: 1.9, // Very hard exercise, physical job
    };

    this.tdee = Math.round(bmr * activityMultipliers[this.activity]);

    // Adjust kcal target based on goal
    this.adjustKcalTarget();

    return this.tdee;
  },

  /**
   * Adjust calorie target based on weight goal
   */
  adjustKcalTarget() {
    const weeklyDeficit = this.weeklyGoalKg * 7700; // 7700 kcal = 1kg fat
    const dailyDeficit = weeklyDeficit / 7;

    this.kcalTarget = Math.round(this.tdee + dailyDeficit);

    // Ensure minimum calorie intake
    const minKcal = this.sex === "male" ? 1500 : 1200;
    if (this.kcalTarget < minKcal) {
      this.kcalTarget = minKcal;
    }
  },

  /**
   * Calculate macro targets
   */
  calculateMacroTargets() {
    // Protein: 25-30% of calories
    this.proteinTarget = Math.round((this.kcalTarget * 0.25) / 4);

    // Fat: 20-35% of calories
    this.fatTarget = Math.round((this.kcalTarget * 0.25) / 9);

    // Carb: remaining calories
    this.carbTarget = Math.round(
      (this.kcalTarget - this.proteinTarget * 4 - this.fatTarget * 9) / 4
    );

    return {
      protein: this.proteinTarget,
      fat: this.fatTarget,
      carb: this.carbTarget,
    };
  },
};

// Static methods
profileSchema.statics = {
  /**
   * Find profiles by goal
   */
  async findByGoal(goal) {
    return this.find({ goal }).populate("userId", "name email");
  },

  /**
   * Get average TDEE by activity level
   */
  async getAverageTDEEByActivity() {
    return this.aggregate([
      { $group: { _id: "$activity", avgTDEE: { $avg: "$tdee" } } },
      { $sort: { avgTDEE: 1 } },
    ]);
  },
};

module.exports = mongoose.model("Profile", profileSchema);
