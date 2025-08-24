const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const logger = require("../utils/logger.util");

/**
 * User service for profile management and user operations
 * Handles user profiles, settings, and preferences
 */
const userService = {
  /**
   * Get user profile with complete information
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).select("-passwordHash");
      const profile = await Profile.findOne({ userId });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        user,
        profile: profile || null,
      };
    } catch (error) {
      logger.error("❌ Get user profile failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      const { name, email, ...profileUpdates } = updates;

      // Update user basic info
      if (name || email) {
        const userUpdates = {};
        if (name) userUpdates.name = name;
        if (email) userUpdates.email = email;

        await User.findByIdAndUpdate(userId, userUpdates);
      }

      // Update or create profile
      let profile = await Profile.findOne({ userId });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { userId },
          { $set: profileUpdates },
          { new: true }
        );
      } else {
        profile = new Profile({
          userId,
          ...profileUpdates,
        });
        await profile.save();
      }

      logger.info("✅ User profile updated", { userId });
      return profile;
    } catch (error) {
      logger.error("❌ Update user profile failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get user statistics
   */
  async getUserStatistics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get basic user info
      const user = await User.findById(userId).select("-passwordHash");
      const profile = await Profile.findOne({ userId });

      // Get activity statistics (placeholder - will be implemented with actual models)
      const stats = {
        totalDays: days,
        activeDays: 0, // Will be calculated from actual data
        totalWeightEntries: 0,
        totalMealEntries: 0,
        totalWorkoutEntries: 0,
        averageWeight: 0,
        weightChange: 0,
        totalCalories: 0,
        averageCalories: 0,
        totalWorkoutMinutes: 0,
        averageWorkoutMinutes: 0,
      };

      logger.info("✅ User statistics retrieved", { userId, days });
      return { user, profile, stats };
    } catch (error) {
      logger.error("❌ Get user statistics failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const profile = await Profile.findOneAndUpdate(
        { userId },
        { $set: { preferences } },
        { new: true, upsert: true }
      );

      logger.info("✅ User preferences updated", { userId });
      return profile.preferences;
    } catch (error) {
      logger.error("❌ Update user preferences failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Delete user account
   */
  async deleteUserAccount(userId, password) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }

      // Delete user and related data
      await User.findByIdAndDelete(userId);
      await Profile.findOneAndDelete({ userId });

      // TODO: Delete related data (weights, meals, workouts, etc.)

      logger.info("✅ User account deleted", { userId });
      return true;
    } catch (error) {
      logger.error("❌ Delete user account failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Placeholder for activity summary
      const summary = {
        period: days,
        weightEntries: 0,
        mealEntries: 0,
        workoutEntries: 0,
        averageWeight: 0,
        totalCalories: 0,
        totalWorkoutMinutes: 0,
        streakDays: 0,
        goalsMet: 0,
        totalGoals: 0,
      };

      logger.info("✅ User activity summary retrieved", { userId, days });
      return summary;
    } catch (error) {
      logger.error("❌ Get user activity summary failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};

module.exports = userService;
