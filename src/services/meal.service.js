const Meal = require("../models/meal.model");
const logger = require("../utils/logger.util");

/**
 * Meal service for meal tracking operations
 * Handles meal entries, nutrition, and statistics
 */
const mealService = {
  /**
   * Add meal entry
   */
  async addMealEntry(userId, mealData) {
    try {
      const {
        mealType,
        name,
        calories,
        protein,
        carb,
        fat,
        dateISO,
        timeISO,
        notes,
        photoId,
      } = mealData;

      const meal = new Meal({
        userId,
        mealType,
        name,
        calories,
        protein,
        carb,
        fat,
        dateISO: dateISO.split("T")[0],
        timeISO,
        notes,
        photoId,
      });

      await meal.save();

      logger.info("✅ Meal entry added", {
        userId,
        mealId: meal._id,
        mealType,
        name,
        calories,
      });
      return meal;
    } catch (error) {
      logger.error("❌ Add meal entry failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get meal entries with pagination
   */
  async getMealEntries(userId, options = {}) {
    try {
      const { startDate, endDate, mealType, limit = 30, page = 1 } = options;
      const skip = (page - 1) * limit;

      const query = { userId };

      if (startDate && endDate) {
        query.dateISO = { $gte: startDate, $lte: endDate };
      }

      if (mealType) {
        query.mealType = mealType;
      }

      const entries = await Meal.find(query)
        .sort({ dateISO: -1, timeISO: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Meal.countDocuments(query);

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };

      logger.info("✅ Meal entries retrieved", {
        userId,
        count: entries.length,
        total,
      });
      return { entries, pagination };
    } catch (error) {
      logger.error("❌ Get meal entries failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Update meal entry
   */
  async updateMealEntry(mealId, userId, updates) {
    try {
      const meal = await Meal.findOneAndUpdate(
        { _id: mealId, userId },
        { $set: updates },
        { new: true }
      );

      if (!meal) {
        throw new Error("Meal entry not found");
      }

      logger.info("✅ Meal entry updated", {
        userId,
        mealId,
        name: updates.name,
      });
      return meal;
    } catch (error) {
      logger.error("❌ Update meal entry failed", {
        error: error.message,
        userId,
        mealId,
      });
      throw error;
    }
  },

  /**
   * Delete meal entry
   */
  async deleteMealEntry(mealId, userId) {
    try {
      const meal = await Meal.findOneAndDelete({ _id: mealId, userId });

      if (!meal) {
        throw new Error("Meal entry not found");
      }

      logger.info("✅ Meal entry deleted", { userId, mealId });
      return true;
    } catch (error) {
      logger.error("❌ Delete meal entry failed", {
        error: error.message,
        userId,
        mealId,
      });
      throw error;
    }
  },

  /**
   * Get nutrition summary for a specific date
   */
  async getNutritionSummary(userId, dateISO) {
    try {
      const meals = await Meal.find({
        userId,
        dateISO: dateISO.split("T")[0],
      });

      const summary = {
        date: dateISO.split("T")[0],
        totalCalories: 0,
        totalProtein: 0,
        totalCarb: 0,
        totalFat: 0,
        mealCount: meals.length,
        meals: meals,
      };

      meals.forEach((meal) => {
        summary.totalCalories += meal.calories || 0;
        summary.totalProtein += meal.protein || 0;
        summary.totalCarb += meal.carb || 0;
        summary.totalFat += meal.fat || 0;
      });

      logger.info("✅ Nutrition summary retrieved", { userId, dateISO });
      return summary;
    } catch (error) {
      logger.error("❌ Get nutrition summary failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get meal statistics
   */
  async getMealStatistics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const meals = await Meal.find({
        userId,
        dateISO: { $gte: startDate.toISOString().split("T")[0] },
      });

      const stats = {
        totalMeals: meals.length,
        averageCaloriesPerDay: 0,
        averageProteinPerDay: 0,
        averageCarbPerDay: 0,
        averageFatPerDay: 0,
        mealTypeDistribution: {},
        mostCommonMeals: [],
      };

      if (meals.length > 0) {
        const totalCalories = meals.reduce(
          (sum, meal) => sum + (meal.calories || 0),
          0
        );
        const totalProtein = meals.reduce(
          (sum, meal) => sum + (meal.protein || 0),
          0
        );
        const totalCarb = meals.reduce(
          (sum, meal) => sum + (meal.carb || 0),
          0
        );
        const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

        stats.averageCaloriesPerDay = Math.round(totalCalories / days);
        stats.averageProteinPerDay = Math.round(totalProtein / days);
        stats.averageCarbPerDay = Math.round(totalCarb / days);
        stats.averageFatPerDay = Math.round(totalFat / days);

        // Meal type distribution
        const mealTypes = {};
        meals.forEach((meal) => {
          mealTypes[meal.mealType] = (mealTypes[meal.mealType] || 0) + 1;
        });
        stats.mealTypeDistribution = mealTypes;
      }

      logger.info("✅ Meal statistics retrieved", {
        userId,
        days,
        totalMeals: stats.totalMeals,
      });
      return stats;
    } catch (error) {
      logger.error("❌ Get meal statistics failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};

module.exports = mealService;
