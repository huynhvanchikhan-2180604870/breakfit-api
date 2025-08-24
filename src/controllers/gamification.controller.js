const gamificationService = require("../services/gamification.service");
const logger = require("../utils/logger.util");

/**
 * Gamification controller for XP, levels, achievements, and rewards
 * Handles all gamification mechanics and progression
 */
const gamificationController = {
  /**
   * Get user gamification profile
   */
  async getUserProfile(req, res) {
    try {
      const userId = req.user._id;

      const profile = await gamificationService.getUserProfile(userId);

      logger.info("✅ Gamification profile retrieved successfully", {
        userId,
        level: profile.currentLevel,
        xp: profile.currentXP,
      });

      res.json({
        success: true,
        message: "Hồ sơ gamification đã được lấy thành công",
        data: { profile },
      });
    } catch (error) {
      logger.error("❌ Get gamification profile failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy hồ sơ gamification thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Award XP to user
   */
  async awardXP(req, res) {
    try {
      const userId = req.user._id;
      const { amount, source, description, category = "general" } = req.body;

      if (!amount || !source) {
        return res.status(400).json({
          success: false,
          message: "Số lượng XP và nguồn là bắt buộc",
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng XP phải dương",
        });
      }

      const result = await gamificationService.awardXP(
        userId,
        amount,
        source,
        description,
        category
      );

      logger.info("✅ XP awarded successfully", {
        userId,
        amount,
        source,
        newLevel: result.newLevel,
      });

      res.json({
        success: true,
        message: "XP đã được trao thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Award XP failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Trao XP thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update user streak
   */
  async updateStreak(req, res) {
    try {
      const userId = req.user._id;
      const { activityType = "general" } = req.body;

      const result = await gamificationService.updateStreak(
        userId,
        activityType
      );

      logger.info("✅ Streak updated successfully", {
        userId,
        currentStreak: result.currentStreak,
        activityType,
      });

      res.json({
        success: true,
        message: "Streak đã được cập nhật thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Update streak failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Cập nhật streak thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Unlock achievement for user
   */
  async unlockAchievement(req, res) {
    try {
      const userId = req.user._id;
      const achievement = req.body;

      if (!achievement || !achievement.name) {
        return res.status(400).json({
          success: false,
          message: "Thông tin achievement là bắt buộc",
        });
      }

      const result = await gamificationService.unlockAchievement(
        userId,
        achievement
      );

      if (result.unlocked) {
        logger.info("✅ Achievement unlocked successfully", {
          userId,
          achievement: achievement.name,
        });

        res.json({
          success: true,
          message: "Achievement đã được mở khóa thành công",
          data: result,
        });
      } else {
        res.json({
          success: false,
          message: "Achievement đã được mở khóa trước đó",
          data: result,
        });
      }
    } catch (error) {
      logger.error("❌ Unlock achievement failed", {
        error: error.message,
        userId: req.user?._id,
        achievement: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Mở khóa achievement thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Add daily challenge
   */
  async addDailyChallenge(req, res) {
    try {
      const userId = req.user._id;
      const challenge = req.body;

      if (!challenge || !challenge.title || !challenge.target) {
        return res.status(400).json({
          success: false,
          message: "Thông tin challenge là bắt buộc",
        });
      }

      const result = await gamificationService.addDailyChallenge(
        userId,
        challenge
      );

      logger.info("✅ Daily challenge added successfully", {
        userId,
        challengeId: challenge.id,
        title: challenge.title,
      });

      res.json({
        success: true,
        message: "Daily challenge đã được thêm thành công",
        data: { challenge: result },
      });
    } catch (error) {
      logger.error("❌ Add daily challenge failed", {
        error: error.message,
        userId: req.user?._id,
        challenge: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Thêm daily challenge thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(req, res) {
    try {
      const userId = req.user._id;
      const { challengeType, challengeId, progress } = req.body;

      if (!challengeType || !challengeId || progress === undefined) {
        return res.status(400).json({
          success: false,
          message: "Loại challenge, ID và tiến độ là bắt buộc",
        });
      }

      const challenge = await gamificationService.updateChallengeProgress(
        userId,
        challengeType,
        challengeId,
        progress
      );

      logger.info("✅ Challenge progress updated successfully", {
        userId,
        challengeType,
        challengeId,
        progress,
        completed: challenge.completed,
      });

      res.json({
        success: true,
        message: "Tiến độ challenge đã được cập nhật thành công",
        data: { challenge },
      });
    } catch (error) {
      logger.error("❌ Update challenge progress failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật tiến độ challenge thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Add quest to user
   */
  async addQuest(req, res) {
    try {
      const userId = req.user._id;
      const quest = req.body;

      if (!quest || !quest.questId || !quest.title) {
        return res.status(400).json({
          success: false,
          message: "Thông tin quest là bắt buộc",
        });
      }

      const result = await gamificationService.addQuest(userId, quest);

      logger.info("✅ Quest added successfully", {
        userId,
        questId: quest.questId,
        title: quest.title,
      });

      res.json({
        success: true,
        message: "Quest đã được thêm thành công",
        data: { quest: result },
      });
    } catch (error) {
      logger.error("❌ Add quest failed", {
        error: error.message,
        userId: req.user?._id,
        quest: req.body,
      });

      if (error.message.includes("already active")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Thêm quest thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update quest progress
   */
  async updateQuestProgress(req, res) {
    try {
      const userId = req.user._id;
      const { questId, objectiveIndex, progress } = req.body;

      if (!questId || objectiveIndex === undefined || progress === undefined) {
        return res.status(400).json({
          success: false,
          message: "Quest ID, index mục tiêu và tiến độ là bắt buộc",
        });
      }

      const quest = await gamificationService.updateQuestProgress(
        userId,
        questId,
        objectiveIndex,
        progress
      );

      logger.info("✅ Quest progress updated successfully", {
        userId,
        questId,
        objectiveIndex,
        progress,
      });
      res.json({
        success: true,
        message: "Tiến độ quest đã được cập nhật thành công",
        data: { quest },
      });
    } catch (error) {
      logger.error("❌ Update quest progress failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật tiến độ quest thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Award coins to user
   */
  async awardCoins(req, res) {
    try {
      const userId = req.user._id;
      const { amount, source } = req.body;

      if (!amount || !source) {
        return res.status(400).json({
          success: false,
          message: "Số lượng coins và nguồn là bắt buộc",
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng coins phải dương",
        });
      }

      const result = await gamificationService.awardCoins(
        userId,
        amount,
        source
      );

      logger.info("✅ Coins awarded successfully", {
        userId,
        amount,
        source,
        newBalance: result.newBalance,
      });

      res.json({
        success: true,
        message: "Coins đã được trao thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Award coins failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Trao coins thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Spend coins from user
   */
  async spendCoins(req, res) {
    try {
      const userId = req.user._id;
      const { amount, item } = req.body;

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: "Số lượng coins là bắt buộc",
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng coins phải dương",
        });
      }

      const result = await gamificationService.spendCoins(userId, amount, item);

      logger.info("✅ Coins spent successfully", {
        userId,
        amount,
        item: item?.name,
        newBalance: result.newBalance,
      });

      res.json({
        success: true,
        message: "Coins đã được tiêu thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Spend coins failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      if (error.message.includes("Insufficient coins")) {
        return res.status(400).json({
          success: false,
          message: "Không đủ coins để thực hiện giao dịch",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tiêu coins thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update user statistics
   */
  async updateStats(req, res) {
    try {
      const userId = req.user._id;
      const { statType, value, operation = "add" } = req.body;

      if (!statType || value === undefined) {
        return res.status(400).json({
          success: false,
          message: "Loại thống kê và giá trị là bắt buộc",
        });
      }

      const result = await gamificationService.updateStats(
        userId,
        statType,
        value,
        operation
      );

      logger.info("✅ Stats updated successfully", {
        userId,
        statType,
        value,
        operation,
        newValue: result,
      });

      res.json({
        success: true,
        message: "Thống kê đã được cập nhật thành công",
        data: { statType, newValue: result },
      });
    } catch (error) {
      logger.error("❌ Update stats failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Cập nhật thống kê thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Add record for user
   */
  async addRecord(req, res) {
    try {
      const userId = req.user._id;
      const { type, value, description } = req.body;

      if (!type || value === undefined) {
        return res.status(400).json({
          success: false,
          message: "Loại record và giá trị là bắt buộc",
        });
      }

      const record = await gamificationService.addRecord(
        userId,
        type,
        value,
        description
      );

      logger.info("✅ Record added successfully", {
        userId,
        type,
        value,
        description,
      });

      res.json({
        success: true,
        message: "Record đã được thêm thành công",
        data: { record },
      });
    } catch (error) {
      logger.error("❌ Add record failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Thêm record thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user achievements
   */
  async getUserAchievements(req, res) {
    try {
      const userId = req.user._id;

      const achievements = await gamificationService.getUserAchievements(
        userId
      );

      logger.info("✅ User achievements retrieved successfully", {
        userId,
        totalCount: achievements.totalCount,
        unlockedCount: achievements.unlockedCount,
      });

      res.json({
        success: true,
        message: "Achievements đã được lấy thành công",
        data: achievements,
      });
    } catch (error) {
      logger.error("❌ Get user achievements failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy achievements thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user challenges
   */
  async getUserChallenges(req, res) {
    try {
      const userId = req.user._id;

      const challenges = await gamificationService.getUserChallenges(userId);

      logger.info("✅ User challenges retrieved successfully", {
        userId,
        dailyCount: challenges.daily.length,
        weeklyCount: challenges.weekly.length,
      });

      res.json({
        success: true,
        message: "Challenges đã được lấy thành công",
        data: challenges,
      });
    } catch (error) {
      logger.error("❌ Get user challenges failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy challenges thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user quests
   */
  async getUserQuests(req, res) {
    try {
      const userId = req.user._id;

      const quests = await gamificationService.getUserQuests(userId);

      logger.info("✅ User quests retrieved successfully", {
        userId,
        activeCount: quests.active.length,
        completedCount: quests.completed.length,
      });

      res.json({
        success: true,
        message: "Quests đã được lấy thành công",
        data: quests,
      });
    } catch (error) {
      logger.error("❌ Get user quests failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy quests thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
  async getLeaderboard(req, res) {
    try {
      const { limit = 50 } = req.query;

      const leaderboard = await gamificationService.getLeaderboard(
        parseInt(limit)
      );

      logger.info("✅ Leaderboard retrieved successfully", {
        userId: req.user?._id,
        count: leaderboard.length,
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        message: "Bảng xếp hạng đã được lấy thành công",
        data: { leaderboard },
      });
    } catch (error) {
      logger.error("❌ Get leaderboard failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy bảng xếp hạng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get top achievers
   */
  async getTopAchievers(req, res) {
    try {
      const { limit = 50 } = req.query;

      const achievers = await gamificationService.getTopAchievers(
        parseInt(limit)
      );

      logger.info("✅ Top achievers retrieved successfully", {
        userId: req.user?._id,
        count: achievers.length,
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        message: "Top achievers đã được lấy thành công",
        data: { achievers },
      });
    } catch (error) {
      logger.error("❌ Get top achievers failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy top achievers thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = gamificationController;
