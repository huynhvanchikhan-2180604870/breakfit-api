const webSocketConfig = require("../config/websocket.config");
const User = require("../models/user.model");
const Event = require("../models/event.model");
const logger = require("../utils/logger.util");

/**
 * WebSocket service for real-time communication
 * Handles live updates, notifications, and real-time features
 */
const websocketService = {
  /**
   * Get WebSocket server instance
   */
  getIO() {
    return webSocketConfig.io;
  },

  /**
   * Send real-time update to user
   */
  async sendToUser(userId, event, data) {
    try {
      if (!webSocketConfig.io) {
        logger.warn("⚠️ WebSocket server not initialized");
        return false;
      }

      webSocketConfig.sendToUser(userId, event, data);

      // Log event
      await Event.createEvent(
        userId,
        "websocket.message_sent",
        "WebSocket message sent",
        `Sent ${event} to user`,
        { event, data },
        { userId }
      );

      return true;
    } catch (error) {
      logger.error("❌ Send to user failed", {
        error: error.message,
        userId,
        event,
      });
      return false;
    }
  },

  /**
   * Broadcast message to all connected clients
   */
  async broadcastToAll(event, data) {
    try {
      if (!webSocketConfig.io) {
        logger.warn("⚠️ WebSocket server not initialized");
        return false;
      }

      webSocketConfig.broadcastToAll(event, data);

      logger.info("📢 Broadcast message sent", {
        event,
        recipients: webSocketConfig.getConnectedClientsCount(),
      });

      return true;
    } catch (error) {
      logger.error("❌ Broadcast failed", { error: error.message, event });
      return false;
    }
  },

  /**
   * Send weight update notification
   */
  async sendWeightUpdate(userId, weightData) {
    try {
      const event = "weight.updated";
      const data = {
        type: "weight_update",
        weight: weightData,
        timestamp: new Date().toISOString(),
      };

      await this.sendToUser(userId, event, data);

      logger.info("✅ Weight update notification sent", { userId });

      return true;
    } catch (error) {
      logger.error("❌ Weight update notification failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Send meal update notification
   */
  async sendMealUpdate(userId, mealData) {
    try {
      const event = "meal.updated";
      const data = {
        type: "meal_update",
        meal: mealData,
        timestamp: new Date().toISOString(),
      };

      await this.sendToUser(userId, event, data);

      logger.info("✅ Meal update notification sent", { userId });

      return true;
    } catch (error) {
      logger.error("❌ Meal update notification failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Send workout update notification
   */
  async sendWorkoutUpdate(userId, workoutData) {
    try {
      const event = "workout.updated";
      const data = {
        type: "workout_update",
        workout: workoutData,
        timestamp: new Date().toISOString(),
      };

      await this.sendToUser(userId, event, data);

      logger.info("✅ Workout update notification sent", { userId });

      return true;
    } catch (error) {
      logger.error("❌ Workout update notification failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Send plan completion notification
   */
  async sendPlanCompletion(userId, planData) {
    try {
      const event = "plan.completed";
      const data = {
        type: "plan_completion",
        plan: planData,
        timestamp: new Date().toISOString(),
      };

      await this.sendToUser(userId, event, data);

      logger.info("✅ Plan completion notification sent", { userId });

      return true;
    } catch (error) {
      logger.error("❌ Plan completion notification failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Send XP/level up notification
   */
  async sendXPUpdate(userId, xpData) {
    try {
      const event = "xp.updated";
      const data = {
        type: "xp_update",
        xp: xpData,
        timestamp: new Date().toISOString(),
      };

      await this.sendToUser(userId, event, data);

      logger.info("✅ XP update notification sent", { userId });

      return true;
    } catch (error) {
      logger.error("❌ XP update notification failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Send badge earned notification
   */
  async sendBadgeEarned(userId, badgeData) {
    try {
      const event = "badge.earned";
      const data = {
        type: "badge_earned",
        badge: badgeData,
        timestamp: new Date().toISOString(),
      };

      await this.sendToUser(userId, event, data);

      logger.info("✅ Badge earned notification sent", { userId });

      return true;
    } catch (error) {
      logger.error("❌ Badge earned notification failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Send challenge update notification
   */
  async sendChallengeUpdate(userId, challengeData) {
    try {
      const event = "challenge.updated";
      const data = {
        type: "challenge_update",
        challenge: challengeData,
        timestamp: new Date().toISOString(),
      };

      await this.sendToUser(userId, event, data);

      logger.info("✅ Challenge update notification sent", { userId });

      return true;
    } catch (error) {
      logger.error("❌ Challenge update notification failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Send real-time progress update
   */
  async sendProgressUpdate(userId, progressData) {
    try {
      const event = "progress.updated";
      const data = {
        type: "progress_update",
        progress: progressData,
        timestamp: new Date().toISOString(),
      };

      await this.sendToUser(userId, event, data);

      logger.info("✅ Progress update notification sent", { userId });

      return true;
    } catch (error) {
      logger.error("❌ Progress update notification failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Send live challenge leaderboard update
   */
  async sendLeaderboardUpdate(challengeId, leaderboardData) {
    try {
      const event = "leaderboard.updated";
      const data = {
        type: "leaderboard_update",
        challengeId,
        leaderboard: leaderboardData,
        timestamp: new Date().toISOString(),
      };

      // Send to all participants
      if (leaderboardData.participants) {
        for (const participant of leaderboardData.participants) {
          await this.sendToUser(participant.userId, event, data);
        }
      }

      logger.info("✅ Leaderboard update sent", {
        challengeId,
        participants: leaderboardData.participants?.length || 0,
      });

      return true;
    } catch (error) {
      logger.error("❌ Leaderboard update failed", {
        error: error.message,
        challengeId,
      });
      return false;
    }
  },

  /**
   * Send system maintenance notification
   */
  async sendSystemMaintenance(message, scheduledTime = null) {
    try {
      const event = "system.maintenance";
      const data = {
        type: "system_maintenance",
        message,
        scheduledTime,
        timestamp: new Date().toISOString(),
      };

      await this.broadcastToAll(event, data);

      logger.info("✅ System maintenance notification sent", {
        message,
        scheduledTime,
      });

      return true;
    } catch (error) {
      logger.error("❌ System maintenance notification failed", {
        error: error.message,
      });
      return false;
    }
  },

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    try {
      if (!webSocketConfig.io) {
        return { connected: false };
      }

      return {
        connected: true,
        ...webSocketConfig.getServerStatus(),
      };
    } catch (error) {
      logger.error("❌ Get connection stats failed", { error: error.message });
      return { connected: false, error: error.message };
    }
  },

  /**
   * Disconnect user
   */
  async disconnectUser(userId) {
    try {
      if (!webSocketConfig.io) {
        return false;
      }

      const sockets = await webSocketConfig.io.fetchSockets();

      for (const socket of sockets) {
        if (socket.userId === userId) {
          socket.disconnect(true);
        }
      }

      logger.info("✅ User disconnected", { userId });

      return true;
    } catch (error) {
      logger.error("❌ User disconnect failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    try {
      if (!webSocketConfig.io) {
        return 0;
      }

      return webSocketConfig.getConnectedClientsCount();
    } catch (error) {
      logger.error("❌ Get online users count failed", {
        error: error.message,
      });
      return 0;
    }
  },
};

module.exports = websocketService;
