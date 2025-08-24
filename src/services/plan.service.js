const Plan = require("../models/plan.model");
const logger = require("../utils/logger.util");

/**
 * Plan service for 30-day plan management
 * Handles plan creation, progress tracking, and completion
 */
const planService = {
  /**
   * Create new 30-day plan
   */
  async create30DayPlan(userId, planData) {
    try {
      const {
        name,
        targetWeight,
        startDate,
        goalType,
        activityLevel,
        preferences,
      } = planData;

      // Check if user already has an active plan
      const existingPlan = await Plan.findOne({
        userId,
        status: { $in: ["active", "paused"] },
      });

      if (existingPlan) {
        throw new Error("Active plan already exists");
      }

      const plan = new Plan({
        userId,
        name,
        targetWeight,
        startDate: new Date(startDate),
        goalType,
        activityLevel,
        preferences,
        status: "active",
      });

      await plan.save();

      logger.info("✅ 30-day plan created", {
        userId,
        planId: plan._id,
        name,
        goalType,
      });
      return plan;
    } catch (error) {
      logger.error("❌ Create 30-day plan failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get current plan
   */
  async getCurrentPlan(userId) {
    try {
      const plan = await Plan.findOne({
        userId,
        status: { $in: ["active", "paused"] },
      });

      logger.info("✅ Current plan retrieved", { userId, planId: plan?._id });
      return plan;
    } catch (error) {
      logger.error("❌ Get current plan failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Update day progress
   */
  async updateDayProgress(planId, userId, dayNumber, progressData) {
    try {
      const plan = await Plan.findOne({ _id: planId, userId });

      if (!plan) {
        throw new Error("Plan not found");
      }

      if (dayNumber < 1 || dayNumber > 30) {
        throw new Error("Invalid day number");
      }

      const dayIndex = dayNumber - 1;
      if (!plan.days[dayIndex]) {
        plan.days[dayIndex] = {
          dayNumber,
          completed: false,
          notes: "",
          completedAt: null,
        };
      }

      plan.days[dayIndex] = {
        ...plan.days[dayIndex],
        ...progressData,
        completedAt: progressData.completed ? new Date() : null,
      };

      await plan.save();

      logger.info("✅ Day progress updated", {
        userId,
        planId,
        dayNumber,
        completed: progressData.completed,
      });
      return plan.days[dayIndex];
    } catch (error) {
      logger.error("❌ Update day progress failed", {
        error: error.message,
        userId,
        planId,
        dayNumber,
      });
      throw error;
    }
  },

  /**
   * Get plan statistics
   */
  async getPlanStatistics(planId, userId) {
    try {
      const plan = await Plan.findOne({ _id: planId, userId });

      if (!plan) {
        throw new Error("Plan not found");
      }

      const completedDays = plan.days.filter((day) => day.completed).length;
      const totalDays = plan.days.length;
      const progressPercent =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      const stats = {
        planId: plan._id,
        name: plan.name,
        goalType: plan.goalType,
        startDate: plan.startDate,
        targetWeight: plan.targetWeight,
        currentProgress: completedDays,
        totalDays,
        progressPercent,
        daysRemaining: 30 - completedDays,
        averageCompletionRate: progressPercent,
        lastCompletedDay:
          plan.days.findLast((day) => day.completed)?.dayNumber || 0,
      };

      logger.info("✅ Plan statistics retrieved", {
        userId,
        planId,
        progressPercent,
      });
      return stats;
    } catch (error) {
      logger.error("❌ Get plan statistics failed", {
        error: error.message,
        userId,
        planId,
      });
      throw error;
    }
  },

  /**
   * Complete plan
   */
  async completePlan(planId, userId, completionData) {
    try {
      const plan = await Plan.findOne({ _id: planId, userId });

      if (!plan) {
        throw new Error("Plan not found");
      }

      if (plan.status === "completed") {
        throw new Error("Plan already completed");
      }

      plan.status = "completed";
      plan.completedAt = new Date();
      plan.finalWeight = completionData.finalWeight;
      plan.completionNotes = completionData.notes;
      plan.rating = completionData.rating;

      await plan.save();

      logger.info("✅ Plan completed", {
        userId,
        planId,
        finalWeight: completionData.finalWeight,
      });
      return plan;
    } catch (error) {
      logger.error("❌ Complete plan failed", {
        error: error.message,
        userId,
        planId,
      });
      throw error;
    }
  },

  /**
   * Get plan history
   */
  async getPlanHistory(userId, options = {}) {
    try {
      const { limit = 10, page = 1 } = options;
      const skip = (page - 1) * limit;

      const plans = await Plan.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Plan.countDocuments({ userId });

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };

      logger.info("✅ Plan history retrieved", {
        userId,
        count: plans.length,
        total,
      });
      return { plans, pagination };
    } catch (error) {
      logger.error("❌ Get plan history failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};

module.exports = planService;
