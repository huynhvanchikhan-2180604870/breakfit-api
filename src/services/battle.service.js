const Battle = require("../models/battle.model");
const User = require("../models/user.model");
const Gamification = require("../models/gamification.model");
const logger = require("../utils/logger.util");

/**
 * Battle service for managing 1-1 battles
 * Handles battle creation, acceptance, and progress tracking
 */
const battleService = {
  /**
   * Create a new battle
   */
  async createBattle(battleData, creatorId) {
    try {
      // Validate battle data
      if (
        !battleData.title ||
        !battleData.battleType ||
        !battleData.durationDays
      ) {
        throw new Error("Title, battle type, and duration are required");
      }

      if (battleData.durationDays < 1 || battleData.durationDays > 90) {
        throw new Error("Duration must be between 1 and 90 days");
      }

      // Get creator info
      const creator = await User.findById(creatorId).select("fullName");
      if (!creator) {
        throw new Error("Creator not found");
      }

      // Create battle
      const battle = new Battle({
        ...battleData,
        creatorId,
        creatorName: creator.fullName,
        status: "pending",
        creatorProgress: {
          baseline: null,
          current: null,
          improvement: 0,
          lastUpdated: null,
          dailyLogs: [],
        },
        opponentProgress: {
          baseline: null,
          current: null,
          improvement: 0,
          lastUpdated: null,
          dailyLogs: [],
        },
        spectators: [],
        updates: [],
      });

      await battle.save();

      logger.info("✅ Battle created successfully", {
        battleId: battle._id,
        creatorId,
        title: battle.title,
      });

      return battle;
    } catch (error) {
      logger.error("❌ Failed to create battle", {
        error: error.message,
        creatorId,
        battleData,
      });
      throw error;
    }
  },

  /**
   * Get battles with filtering and pagination
   */
  async getBattles(options = {}) {
    try {
      const {
        status,
        battleType,
        limit = 20,
        page = 1,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (battleType) query.battleType = battleType;

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Execute query
      const battles = await Battle.find(query)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .populate("creatorId", "fullName avatar")
        .populate("opponentId", "fullName avatar");

      // Get total count
      const total = await Battle.countDocuments(query);

      return {
        battles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("❌ Failed to get battles", {
        error: error.message,
        options,
      });
      throw error;
    }
  },

  /**
   * Get battle by ID with full details
   */
  async getBattleById(battleId, userId = null) {
    try {
      const battle = await Battle.findById(battleId)
        .populate("creatorId", "fullName avatar email")
        .populate("opponentId", "fullName avatar email")
        .populate("spectators.userId", "fullName avatar")
        .populate("updates.userId", "fullName avatar");

      if (!battle) {
        throw new Error("Battle not found");
      }

      // Add user-specific data if userId provided
      if (userId) {
        battle.userRole = this.getUserRole(battle, userId);
        battle.canAccept = battle.canUserAccept(userId);
        battle.canUpdate = this.canUserUpdate(battle, userId);
      }

      return battle;
    } catch (error) {
      logger.error("❌ Failed to get battle by ID", {
        error: error.message,
        battleId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Accept a battle
   */
  async acceptBattle(battleId, opponentId) {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle) {
        throw new Error("Battle not found");
      }

      // Check if user can accept
      const canAccept = battle.canUserAccept(opponentId);
      if (!canAccept.canAccept) {
        throw new Error(canAccept.reason);
      }

      // Get opponent info
      const opponent = await User.findById(opponentId).select("fullName");
      if (!opponent) {
        throw new Error("Opponent not found");
      }

      // Accept battle
      battle.acceptBattle(opponentId, opponent.fullName);
      await battle.save();

      // Award XP for accepting
      await this.awardAcceptXP(opponentId, battle);

      logger.info("✅ Battle accepted successfully", {
        battleId,
        opponentId,
      });

      return battle;
    } catch (error) {
      logger.error("❌ Failed to accept battle", {
        error: error.message,
        battleId,
        opponentId,
      });
      throw error;
    }
  },

  /**
   * Set baseline measurement
   */
  async setBaseline(battleId, userId, baselineValue) {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle) {
        throw new Error("Battle not found");
      }

      // Set baseline
      battle.setBaseline(userId, baselineValue);
      await battle.save();

      logger.info("✅ Battle baseline set successfully", {
        battleId,
        userId,
        baselineValue,
      });

      return battle;
    } catch (error) {
      logger.error("❌ Failed to set battle baseline", {
        error: error.message,
        battleId,
        userId,
        baselineValue,
      });
      throw error;
    }
  },

  /**
   * Update battle progress
   */
  async updateProgress(battleId, userId, currentValue, note = "") {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle) {
        throw new Error("Battle not found");
      }

      // Update progress
      battle.updateProgress(userId, currentValue, note);
      await battle.save();

      // Award XP for progress
      await this.awardProgressXP(userId, battle);

      logger.info("✅ Battle progress updated successfully", {
        battleId,
        userId,
        currentValue,
        note,
      });

      return battle;
    } catch (error) {
      logger.error("❌ Failed to update battle progress", {
        error: error.message,
        battleId,
        userId,
        currentValue,
      });
      throw error;
    }
  },

  /**
   * Complete battle manually
   */
  async completeBattle(battleId) {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle) {
        throw new Error("Battle not found");
      }

      // Complete battle
      battle.completeBattle();
      await battle.save();

      // Award completion XP
      if (battle.winner) {
        await this.awardWinnerXP(battle.winner, battle);
      }

      logger.info("✅ Battle completed successfully", {
        battleId,
        winner: battle.winner,
      });

      return battle;
    } catch (error) {
      logger.error("❌ Failed to complete battle", {
        error: error.message,
        battleId,
      });
      throw error;
    }
  },

  /**
   * Add battle update
   */
  async addUpdate(battleId, userId, type, message) {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle) {
        throw new Error("Battle not found");
      }

      // Get user info
      const user = await User.findById(userId).select("fullName");
      if (!user) {
        throw new Error("User not found");
      }

      // Add update
      battle.addUpdate(userId, user.fullName, type, message);
      await battle.save();

      logger.info("✅ Battle update added successfully", {
        battleId,
        userId,
        type,
        message,
      });

      return battle;
    } catch (error) {
      logger.error("❌ Failed to add battle update", {
        error: error.message,
        battleId,
        userId,
        type,
        message,
      });
      throw error;
    }
  },

  /**
   * Add spectator to battle
   */
  async addSpectator(battleId, userId, supportFor = "neutral") {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle) {
        throw new Error("Battle not found");
      }

      // Add spectator
      battle.addSpectator(userId, supportFor);
      await battle.save();

      logger.info("✅ Spectator added to battle successfully", {
        battleId,
        userId,
        supportFor,
      });

      return battle;
    } catch (error) {
      logger.error("❌ Failed to add spectator to battle", {
        error: error.message,
        battleId,
        userId,
        supportFor,
      });
      throw error;
    }
  },

  /**
   * Get user's battles
   */
  async getUserBattles(userId, options = {}) {
    try {
      const { status, limit = 20, page = 1 } = options;

      // Build query
      const query = {
        $or: [{ creatorId: userId }, { opponentId: userId }],
      };
      if (status) query.status = status;

      const battles = await Battle.find(query)
        .populate("creatorId", "fullName avatar")
        .populate("opponentId", "fullName avatar")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      // Get total count
      const total = await Battle.countDocuments(query);

      return {
        battles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("❌ Failed to get user battles", {
        error: error.message,
        userId,
        options,
      });
      throw error;
    }
  },

  /**
   * Get battle statistics
   */
  async getBattleStats(userId) {
    try {
      const stats = {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        winRate: 0,
        totalXP: 0,
        averageScore: 0,
      };

      const battles = await Battle.find({
        $or: [{ creatorId: userId }, { opponentId: userId }],
        status: "completed",
      });

      stats.totalBattles = battles.length;

      for (const battle of battles) {
        if (battle.winner && battle.winner.equals(userId)) {
          stats.wins++;
        } else if (battle.results.tie) {
          stats.ties++;
        } else {
          stats.losses++;
        }
      }

      if (stats.totalBattles > 0) {
        stats.winRate = (stats.wins / stats.totalBattles) * 100;
      }

      return stats;
    } catch (error) {
      logger.error("❌ Failed to get battle stats", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  // Helper methods
  getUserRole(battle, userId) {
    if (battle.creatorId.equals(userId)) return "creator";
    if (battle.opponentId && battle.opponentId.equals(userId))
      return "opponent";
    return "spectator";
  },

  canUserUpdate(battle, userId) {
    return (
      battle.creatorId.equals(userId) ||
      (battle.opponentId && battle.opponentId.equals(userId))
    );
  },

  // XP Award methods
  async awardAcceptXP(userId, battle) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (gamification) {
        const xpAmount = 100; // XP for accepting battle
        gamification.addXP(xpAmount, `Accepted battle: ${battle.title}`);
        await gamification.save();
      }
    } catch (error) {
      logger.error("❌ Failed to award accept XP", {
        error: error.message,
        userId,
        battleId: battle._id,
      });
    }
  },

  async awardProgressXP(userId, battle) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (gamification) {
        const xpAmount = 25; // XP for daily progress
        gamification.addXP(xpAmount, `Battle progress: ${battle.title}`);
        await gamification.save();
      }
    } catch (error) {
      logger.error("❌ Failed to award progress XP", {
        error: error.message,
        userId,
        battleId: battle._id,
      });
    }
  },

  async awardWinnerXP(userId, battle) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (gamification) {
        const xpAmount = 500; // XP for winning battle
        gamification.addXP(xpAmount, `Won battle: ${battle.title}`);
        await gamification.save();
      }
    } catch (error) {
      logger.error("❌ Failed to award winner XP", {
        error: error.message,
        userId,
        battleId: battle._id,
      });
    }
  },
};

module.exports = battleService;
