const Profile = require("../models/profile.model");
const logger = require("../utils/logger.util");

/**
 * TDEE calculation service
 * Handles BMR, TDEE, and macro calculations using various formulas
 */
const tdeeService = {
  /**
   * Calculate BMR using Mifflin-St Jeor formula
   */
  calculateBMR(weightKg, heightCm, age, sex) {
    try {
      let bmr;

      if (sex === "male") {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
      } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      }

      return Math.round(bmr);
    } catch (error) {
      logger.error("❌ BMR calculation failed", {
        error: error.message,
        weightKg,
        heightCm,
        age,
        sex,
      });
      throw error;
    }
  },

  /**
   * Calculate BMR using Katch-McArdle formula (requires body fat %)
   */
  calculateBMRKatchMcArdle(weightKg, bodyFatPercent) {
    try {
      const leanMass = weightKg * (1 - bodyFatPercent / 100);
      const bmr = 370 + 21.6 * leanMass;
      return Math.round(bmr);
    } catch (error) {
      logger.error("❌ Katch-McArdle BMR calculation failed", {
        error: error.message,
        weightKg,
        bodyFatPercent,
      });
      throw error;
    }
  },

  /**
   * Get activity multiplier
   */
  getActivityMultiplier(activity) {
    const multipliers = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      active: 1.725, // Hard exercise 6-7 days/week
      athlete: 1.9, // Very hard exercise, physical job
    };

    return multipliers[activity] || 1.2;
  },

  /**
   * Calculate TDEE
   */
  calculateTDEE(bmr, activity) {
    try {
      const multiplier = this.getActivityMultiplier(activity);
      const tdee = bmr * multiplier;
      return Math.round(tdee);
    } catch (error) {
      logger.error("❌ TDEE calculation failed", {
        error: error.message,
        bmr,
        activity,
      });
      throw error;
    }
  },

  /**
   * Calculate calorie target based on goal
   */
  calculateCalorieTarget(tdee, goal, weeklyGoalKg) {
    try {
      let calorieTarget = tdee;

      if (goal === "lose") {
        // Weight loss: create calorie deficit
        const weeklyDeficit = weeklyGoalKg * 7700; // 7700 kcal = 1kg fat
        const dailyDeficit = weeklyDeficit / 7;
        calorieTarget = tdee + dailyDeficit;
      } else if (goal === "gain") {
        // Weight gain: create calorie surplus
        const weeklySurplus = weeklyGoalKg * 7700;
        const dailySurplus = weeklySurplus / 7;
        calorieTarget = tdee + dailySurplus;
      }
      // "maintain" keeps TDEE as is

      return Math.round(calorieTarget);
    } catch (error) {
      logger.error("❌ Calorie target calculation failed", {
        error: error.message,
        tdee,
        goal,
        weeklyGoalKg,
      });
      throw error;
    }
  },

  /**
   * Calculate macro targets
   */
  calculateMacroTargets(calorieTarget, preferences = {}) {
    try {
      const {
        proteinPercent = 25,
        fatPercent = 25,
        carbPercent = 50,
      } = preferences;

      // Ensure percentages add up to 100
      const total = proteinPercent + fatPercent + carbPercent;
      if (Math.abs(total - 100) > 1) {
        throw new Error("Macro percentages must add up to 100%");
      }

      const protein = Math.round((calorieTarget * proteinPercent) / 100 / 4); // 4 kcal per gram
      const fat = Math.round((calorieTarget * fatPercent) / 100 / 9); // 9 kcal per gram
      const carb = Math.round((calorieTarget * carbPercent) / 100 / 4); // 4 kcal per gram

      return { protein, fat, carb };
    } catch (error) {
      logger.error("❌ Macro calculation failed", {
        error: error.message,
        calorieTarget,
        preferences,
      });
      throw error;
    }
  },

  /**
   * Calculate macro targets with automatic adjustment
   */
  calculateAutoMacroTargets(calorieTarget, goal, activity) {
    try {
      let proteinPercent, fatPercent, carbPercent;

      if (goal === "lose") {
        // Higher protein for weight loss
        proteinPercent = 30;
        fatPercent = 25;
        carbPercent = 45;
      } else if (goal === "gain") {
        // Higher carbs for weight gain
        proteinPercent = 25;
        fatPercent = 20;
        carbPercent = 55;
      } else {
        // Balanced for maintenance
        proteinPercent = 25;
        fatPercent = 25;
        carbPercent = 50;
      }

      // Adjust based on activity level
      if (activity === "athlete" || activity === "active") {
        proteinPercent += 5;
        carbPercent += 5;
        fatPercent -= 10;
      }

      return this.calculateMacroTargets(calorieTarget, {
        proteinPercent,
        fatPercent,
        carbPercent,
      });
    } catch (error) {
      logger.error("❌ Auto macro calculation failed", {
        error: error.message,
        calorieTarget,
        goal,
        activity,
      });
      throw error;
    }
  },

  /**
   * Calculate meal distribution
   */
  calculateMealDistribution(calorieTarget, mealCount = 3) {
    try {
      const baseMealCalories = Math.round(calorieTarget / mealCount);

      let distribution;

      if (mealCount === 3) {
        // Breakfast, Lunch, Dinner
        distribution = {
          breakfast: Math.round(baseMealCalories * 0.3), // 30%
          lunch: Math.round(baseMealCalories * 0.35), // 35%
          dinner: Math.round(baseMealCalories * 0.35), // 35%
        };
      } else if (mealCount === 4) {
        // Breakfast, Lunch, Snack, Dinner
        distribution = {
          breakfast: Math.round(baseMealCalories * 0.25), // 25%
          lunch: Math.round(baseMealCalories * 0.3), // 30%
          snack: Math.round(baseMealCalories * 0.2), // 20%
          dinner: Math.round(baseMealCalories * 0.25), // 25%
        };
      } else if (mealCount === 5) {
        // Breakfast, Snack, Lunch, Snack, Dinner
        distribution = {
          breakfast: Math.round(baseMealCalories * 0.25), // 25%
          morningSnack: Math.round(baseMealCalories * 0.15), // 15%
          lunch: Math.round(baseMealCalories * 0.25), // 25%
          afternoonSnack: Math.round(baseMealCalories * 0.15), // 15%
          dinner: Math.round(baseMealCalories * 0.2), // 20%
        };
      } else {
        // Default to equal distribution
        distribution = {};
        for (let i = 0; i < mealCount; i++) {
          distribution[`meal${i + 1}`] = baseMealCalories;
        }
      }

      return distribution;
    } catch (error) {
      logger.error("❌ Meal distribution calculation failed", {
        error: error.message,
        calorieTarget,
        mealCount,
      });
      throw error;
    }
  },

  /**
   * Calculate weight loss timeline
   */
  calculateWeightLossTimeline(currentWeight, targetWeight, weeklyGoalKg) {
    try {
      const weightDiff = Math.abs(targetWeight - currentWeight);
      const weeksToGoal = Math.ceil(weightDiff / Math.abs(weeklyGoalKg));

      const timeline = [];
      let currentWeightKg = currentWeight;

      for (let week = 1; week <= weeksToGoal; week++) {
        const weeklyChange = weeklyGoalKg;
        currentWeightKg += weeklyChange;

        timeline.push({
          week,
          targetWeight: Math.round(currentWeightKg * 100) / 100,
          calories: this.calculateCalorieTarget(
            this.calculateTDEE(
              this.calculateBMR(currentWeightKg, 170, 25, "male"), // Placeholder values
              "moderate"
            ),
            "lose",
            weeklyGoalKg
          ),
        });
      }

      return {
        weeksToGoal,
        timeline,
        estimatedCompletion: new Date(
          Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000
        ),
      };
    } catch (error) {
      logger.error("❌ Weight loss timeline calculation failed", {
        error: error.message,
        currentWeight,
        targetWeight,
        weeklyGoalKg,
      });
      throw error;
    }
  },

  /**
   * Update user profile with new calculations
   */
  async updateUserProfile(userId, profileData) {
    try {
      const profile = await Profile.findOne({ userId });
      if (!profile) {
        throw new Error("Profile not found");
      }

      // Update profile data
      Object.assign(profile, profileData);

      // Recalculate TDEE and targets
      if (
        profile.sex &&
        profile.heightCm &&
        profile.currentWeightKg &&
        profile.birthYear &&
        profile.activity
      ) {
        const bmr = this.calculateBMR(
          profile.currentWeightKg,
          profile.heightCm,
          new Date().getFullYear() - profile.birthYear,
          profile.sex
        );

        profile.tdee = this.calculateTDEE(bmr, profile.activity);
        profile.kcalTarget = this.calculateCalorieTarget(
          profile.tdee,
          profile.goal,
          profile.weeklyGoalKg
        );

        // Calculate macro targets
        const macros = this.calculateAutoMacroTargets(
          profile.kcalTarget,
          profile.goal,
          profile.activity
        );

        profile.proteinTarget = macros.protein;
        profile.carbTarget = macros.carb;
        profile.fatTarget = macros.fat;
      }

      await profile.save();

      logger.info("✅ User profile updated with new calculations", { userId });

      return profile;
    } catch (error) {
      logger.error("❌ Profile update failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};

module.exports = tdeeService;
