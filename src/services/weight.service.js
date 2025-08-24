const Weight = require("../models/weight.model");
const logger = require("../utils/logger.util");

/**
 * Weight service for weight tracking operations
 * Handles weight entries, trends, and statistics
 */
const weightService = {
  /**
   * Add weight entry
   */
  async addWeightEntry(userId, weightData) {
    try {
      const { weightKg, dateISO, notes } = weightData;

      // Check if weight entry already exists for this date
      const existingEntry = await Weight.findOne({
        userId,
        dateISO: dateISO.split("T")[0], // Extract date part only
      });

      if (existingEntry) {
        throw new Error("Weight entry already exists for this date");
      }

      const weight = new Weight({
        userId,
        weightKg,
        dateISO: dateISO.split("T")[0],
        notes,
      });

      await weight.save();

      logger.info("✅ Weight entry added", {
        userId,
        weightId: weight._id,
        weightKg,
      });
      return weight;
    } catch (error) {
      logger.error("❌ Add weight entry failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get weight entries with pagination
   */
  async getWeightEntries(userId, options = {}) {
    try {
      const { startDate, endDate, limit = 30, page = 1 } = options;
      const skip = (page - 1) * limit;

      const query = { userId };

      if (startDate && endDate) {
        query.dateISO = { $gte: startDate, $lte: endDate };
      }

      const entries = await Weight.find(query)
        .sort({ dateISO: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Weight.countDocuments(query);

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };

      logger.info("✅ Weight entries retrieved", {
        userId,
        count: entries.length,
        total,
      });
      return { entries, pagination };
    } catch (error) {
      logger.error("❌ Get weight entries failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Update weight entry
   */
  async updateWeightEntry(weightId, userId, updates) {
    try {
      const weight = await Weight.findOneAndUpdate(
        { _id: weightId, userId },
        { $set: updates },
        { new: true }
      );

      if (!weight) {
        throw new Error("Weight entry not found");
      }

      logger.info("✅ Weight entry updated", {
        userId,
        weightId,
        weightKg: updates.weightKg,
      });
      return weight;
    } catch (error) {
      logger.error("❌ Update weight entry failed", {
        error: error.message,
        userId,
        weightId,
      });
      throw error;
    }
  },

  /**
   * Delete weight entry
   */
  async deleteWeightEntry(weightId, userId) {
    try {
      const weight = await Weight.findOneAndDelete({ _id: weightId, userId });

      if (!weight) {
        throw new Error("Weight entry not found");
      }

      logger.info("✅ Weight entry deleted", { userId, weightId });
      return true;
    } catch (error) {
      logger.error("❌ Delete weight entry failed", {
        error: error.message,
        userId,
        weightId,
      });
      throw error;
    }
  },

  /**
   * Get weight trends
   */
  async getWeightTrends(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const entries = await Weight.find({
        userId,
        dateISO: { $gte: startDate.toISOString().split("T")[0] },
      }).sort({ dateISO: 1 });

      if (entries.length < 2) {
        return {
          trend: "insufficient_data",
          change: 0,
          average: entries[0]?.weightKg || 0,
          entries: entries,
        };
      }

      const firstWeight = entries[0].weightKg;
      const lastWeight = entries[entries.length - 1].weightKg;
      const change = lastWeight - firstWeight;
      const average =
        entries.reduce((sum, entry) => sum + entry.weightKg, 0) /
        entries.length;

      let trend = "stable";
      if (change > 0.5) trend = "increasing";
      else if (change < -0.5) trend = "decreasing";

      logger.info("✅ Weight trends retrieved", {
        userId,
        days,
        trend,
        change,
      });
      return {
        trend,
        change: Math.round(change * 10) / 10,
        average: Math.round(average * 10) / 10,
        entries: entries,
      };
    } catch (error) {
      logger.error("❌ Get weight trends failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get weight statistics
   */
  async getWeightStatistics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const entries = await Weight.find({
        userId,
        dateISO: { $gte: startDate.toISOString().split("T")[0] },
      });

      if (entries.length === 0) {
        return {
          totalEntries: 0,
          averageWeight: 0,
          minWeight: 0,
          maxWeight: 0,
          weightChange: 0,
          consistency: 0,
        };
      }

      const weights = entries.map((entry) => entry.weightKg);
      const averageWeight =
        weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      const weightChange = weights[weights.length - 1] - weights[0];

      // Calculate consistency (standard deviation)
      const variance =
        weights.reduce(
          (sum, weight) => sum + Math.pow(weight - averageWeight, 2),
          0
        ) / weights.length;
      const consistency = Math.sqrt(variance);

      logger.info("✅ Weight statistics retrieved", {
        userId,
        days,
        totalEntries: entries.length,
      });
      return {
        totalEntries: entries.length,
        averageWeight: Math.round(averageWeight * 10) / 10,
        minWeight: Math.round(minWeight * 10) / 10,
        maxWeight: Math.round(maxWeight * 10) / 10,
        weightChange: Math.round(weightChange * 10) / 10,
        consistency: Math.round(consistency * 10) / 10,
      };
    } catch (error) {
      logger.error("❌ Get weight statistics failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};

module.exports = weightService;
