const Gamification = require("../models/gamification.model");
const User = require("../models/user.model");
const logger = require("../utils/logger.util");

/**
 * Gamification service for XP, levels, achievements, and rewards
 * Handles all gamification mechanics and progression
 */
const gamificationService = {
  /**
   * Initialize gamification for user
   */
  async initializeGamification(userId) {
    try {
      // Check if gamification already exists
      let gamification = await Gamification.findOne({ userId });
      if (gamification) {
        return gamification;
      }

      // Create new gamification profile
      gamification = new Gamification({
        userId,
        currentXP: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        dailyChallenges: [],
        weeklyChallenges: [],
        activeQuests: [],
        achievements: [],
        stats: {
          totalWorkouts: 0,
          totalCaloriesBurned: 0,
          totalDistance: 0,
          totalWeightLost: 0,
          totalMealsLogged: 0,
          totalDaysActive: 0,
          bestWorkout: 0,
          longestWorkout: 0,
        },
      });

      await gamification.save();

      logger.info("✅ Gamification initialized successfully", {
        userId,
        gamificationId: gamification._id,
      });

      return gamification;
    } catch (error) {
      logger.error("❌ Failed to initialize gamification", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Award XP to user
   */
  async awardXP(userId, amount, source, description, category = "general") {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      // Add XP
      gamification.addXP(amount, source, description, category);
      await gamification.save();

      logger.info("✅ XP awarded successfully", {
        userId,
        amount,
        source,
        newLevel: gamification.currentLevel,
        newXP: gamification.currentXP,
      });

      return {
        newXP: gamification.currentXP,
        newLevel: gamification.currentLevel,
        levelProgress: gamification.levelProgress,
        leveledUp:
          gamification.levelHistory.length > 0 &&
          gamification.levelHistory[gamification.levelHistory.length - 1]
            .level === gamification.currentLevel,
      };
    } catch (error) {
      logger.error("❌ Failed to award XP", {
        error: error.message,
        userId,
        amount,
        source,
      });
      throw error;
    }
  },

  /**
   * Update user streak
   */
  async updateStreak(userId, activityType = "general") {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      const newStreak = gamification.updateStreak(activityType);
      await gamification.save();

      // Award streak XP
      if (newStreak > 0) {
        const streakXP = Math.floor(newStreak * 10); // 10 XP per day in streak
        await this.awardXP(
          userId,
          streakXP,
          "streak",
          `Streak: ${newStreak} days`
        );
      }

      logger.info("✅ Streak updated successfully", {
        userId,
        newStreak,
        longestStreak: gamification.longestStreak,
        activityType,
      });

      return {
        currentStreak: gamification.currentStreak,
        longestStreak: gamification.longestStreak,
        streakType: gamification.streakType,
      };
    } catch (error) {
      logger.error("❌ Failed to update streak", {
        error: error.message,
        userId,
        activityType,
      });
      throw error;
    }
  },

  /**
   * Unlock achievement for user
   */
  async unlockAchievement(userId, achievement) {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      const unlocked = gamification.addAchievement(achievement);
      if (unlocked) {
        await gamification.save();

        logger.info("✅ Achievement unlocked successfully", {
          userId,
          achievement: achievement.name,
          rarity: achievement.rarity,
        });

        return {
          unlocked: true,
          achievement: achievement.name,
          xpReward: achievement.xpReward,
          newLevel: gamification.currentLevel,
        };
      }

      return { unlocked: false, reason: "Already unlocked" };
    } catch (error) {
      logger.error("❌ Failed to unlock achievement", {
        error: error.message,
        userId,
        achievement: achievement.name,
      });
      throw error;
    }
  },

  /**
   * Add daily challenge
   */
  async addDailyChallenge(userId, challenge) {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      // Remove expired challenges
      gamification.dailyChallenges = gamification.dailyChallenges.filter(
        (c) => new Date() < new Date(c.expiresAt)
      );

      // Add new challenge
      gamification.dailyChallenges.push({
        challengeId: challenge.id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        target: challenge.target,
        current: 0,
        completed: false,
        xpReward: challenge.xpReward,
        expiresAt: challenge.expiresAt,
      });

      await gamification.save();

      logger.info("✅ Daily challenge added successfully", {
        userId,
        challengeId: challenge.id,
        title: challenge.title,
      });

      return gamification.dailyChallenges[
        gamification.dailyChallenges.length - 1
      ];
    } catch (error) {
      logger.error("❌ Failed to add daily challenge", {
        error: error.message,
        userId,
        challenge,
      });
      throw error;
    }
  },

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(userId, challengeType, challengeId, progress) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        throw new Error("Gamification profile not found");
      }

      const challenge = gamification.updateChallengeProgress(
        challengeType,
        challengeId,
        progress
      );
      await gamification.save();

      logger.info("✅ Challenge progress updated successfully", {
        userId,
        challengeType,
        challengeId,
        progress,
        completed: challenge.completed,
      });

      return challenge;
    } catch (error) {
      logger.error("❌ Failed to update challenge progress", {
        error: error.message,
        userId,
        challengeType,
        challengeId,
        progress,
      });
      throw error;
    }
  },

  /**
   * Add quest to user
   */
  async addQuest(userId, quest) {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      gamification.addQuest(quest);
      await gamification.save();

      logger.info("✅ Quest added successfully", {
        userId,
        questId: quest.questId,
        title: quest.title,
      });

      return gamification.activeQuests[gamification.activeQuests.length - 1];
    } catch (error) {
      logger.error("❌ Failed to add quest", {
        error: error.message,
        userId,
        quest,
      });
      throw error;
    }
  },

  /**
   * Update quest progress
   */
  async updateQuestProgress(userId, questId, objectiveIndex, progress) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        throw new Error("Gamification profile not found");
      }

      const quest = gamification.updateQuestProgress(
        questId,
        objectiveIndex,
        progress
      );
      await gamification.save();

      logger.info("✅ Quest progress updated successfully", {
        userId,
        questId,
        objectiveIndex,
        progress,
      });

      return quest;
    } catch (error) {
      logger.error("❌ Failed to update quest progress", {
        error: error.message,
        userId,
        questId,
        objectiveIndex,
        progress,
      });
      throw error;
    }
  },

  /**
   * Award coins to user
   */
  async awardCoins(userId, amount, source) {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      gamification.addCoins(amount, source);
      await gamification.save();

      logger.info("✅ Coins awarded successfully", {
        userId,
        amount,
        source,
        newBalance: gamification.coins,
      });

      return {
        newBalance: gamification.coins,
        amountAwarded: amount,
      };
    } catch (error) {
      logger.error("❌ Failed to award coins", {
        error: error.message,
        userId,
        amount,
        source,
      });
      throw error;
    }
  },

  /**
   * Spend coins from user
   */
  async spendCoins(userId, amount, item) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        throw new Error("Gamification profile not found");
      }

      gamification.spendCoins(amount, item);
      await gamification.save();

      logger.info("✅ Coins spent successfully", {
        userId,
        amount,
        item: item?.name,
        newBalance: gamification.coins,
      });

      return {
        newBalance: gamification.coins,
        amountSpent: amount,
        item: item,
      };
    } catch (error) {
      logger.error("❌ Failed to spend coins", {
        error: error.message,
        userId,
        amount,
        item,
      });
      throw error;
    }
  },

  /**
   * Update user statistics
   */
  async updateStats(userId, statType, value, operation = "add") {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      gamification.updateStats(statType, value, operation);
      await gamification.save();

      logger.info("✅ Stats updated successfully", {
        userId,
        statType,
        value,
        operation,
        newValue: gamification.stats[statType],
      });

      return gamification.stats[statType];
    } catch (error) {
      logger.error("❌ Failed to update stats", {
        error: error.message,
        userId,
        statType,
        value,
        operation,
      });
      throw error;
    }
  },

  /**
   * Add record for user
   */
  async addRecord(userId, type, value, description) {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      gamification.addRecord(type, value, description);
      await gamification.save();

      logger.info("✅ Record added successfully", {
        userId,
        type,
        value,
        description,
      });

      return gamification.records[gamification.records.length - 1];
    } catch (error) {
      logger.error("❌ Failed to add record", {
        error: error.message,
        userId,
        type,
        value,
        description,
      });
      throw error;
    }
  },

  /**
   * Get user gamification profile
   */
  async getUserProfile(userId) {
    try {
      let gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        gamification = await this.initializeGamification(userId);
      }

      return gamification;
    } catch (error) {
      logger.error("❌ Failed to get user gamification profile", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 100) {
    try {
      const leaderboard = await Gamification.getLeaderboard(limit);

      logger.info("✅ Leaderboard retrieved successfully", {
        count: leaderboard.length,
        limit,
      });

      return leaderboard;
    } catch (error) {
      logger.error("❌ Failed to get leaderboard", {
        error: error.message,
        limit,
      });
      throw error;
    }
  },

  /**
   * Get top achievers
   */
  async getTopAchievers(limit = 50) {
    try {
      const achievers = await Gamification.getTopAchievers(limit);

      logger.info("✅ Top achievers retrieved successfully", {
        count: achievers.length,
        limit,
      });

      return achievers;
    } catch (error) {
      logger.error("❌ Failed to get top achievers", {
        error: error.message,
        limit,
      });
      throw error;
    }
  },

  /**
   * Get user achievements
   */
  async getUserAchievements(userId) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        return { achievements: [], totalCount: 0, unlockedCount: 0 };
      }

      return {
        achievements: gamification.achievements,
        totalCount: gamification.totalAchievements,
        unlockedCount: gamification.achievements.length,
        achievementPoints: gamification.achievementPoints,
      };
    } catch (error) {
      logger.error("❌ Failed to get user achievements", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get user challenges
   */
  async getUserChallenges(userId) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        return { daily: [], weekly: [] };
      }

      // Filter expired challenges
      const now = new Date();
      const activeDaily = gamification.dailyChallenges.filter(
        (c) => new Date(c.expiresAt) > now
      );
      const activeWeekly = gamification.weeklyChallenges.filter(
        (c) => new Date(c.expiresAt) > now
      );

      return {
        daily: activeDaily,
        weekly: activeWeekly,
      };
    } catch (error) {
      logger.error("❌ Failed to get user challenges", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get user quests
   */
  async getUserQuests(userId) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (!gamification) {
        return { active: [], completed: [] };
      }

      return {
        active: gamification.activeQuests,
        completed: gamification.completedQuests,
      };
    } catch (error) {
      logger.error("❌ Failed to get user quests", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
  async getTopAchievers(limit = 50) {
    try {
      const achievers = await Gamification.getTopAchievers(limit);

      logger.info("✅ Top achievers retrieved successfully", {
        count: achievers.length,
        limit,
      });

      return achievers;
    } catch (error) {
      logger.error("❌ Failed to get top achievers", {
        error: error.message,
        limit,
      });
      throw error;
    }
  },
};

module.exports = gamificationService;
