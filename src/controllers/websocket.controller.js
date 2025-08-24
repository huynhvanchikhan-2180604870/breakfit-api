const websocketService = require("../services/websocket.service");
const logger = require("../utils/logger.util");

/**
 * WebSocket controller for real-time communication
 * Handles WebSocket connections, events, and broadcasting
 */
const websocketController = {
  /**
   * Handle WebSocket connection
   */
  async handleConnection(socket, userId) {
    try {
      // Store user ID in socket
      socket.userId = userId;

      // Connect user to WebSocket service
      await websocketService.connectUser(userId, socket.id);

      // Send welcome message
      socket.emit("welcome", {
        message:
          "Chào mừng bạn đến với BreakFit! Kết nối real-time đã được thiết lập",
        userId,
        timestamp: new Date().toISOString(),
      });

      // Join user to personal room
      socket.join(`user:${userId}`);

      // Send connection status
      socket.emit("connection_status", {
        connected: true,
        userId,
        timestamp: new Date().toISOString(),
      });

      logger.info("✅ WebSocket connection established", {
        userId,
        socketId: socket.id,
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        try {
          await websocketService.disconnectUser(userId);
          logger.info("✅ WebSocket connection closed", {
            userId,
            socketId: socket.id,
          });
        } catch (error) {
          logger.error("❌ WebSocket disconnect failed", {
            error: error.message,
            userId,
            socketId: socket.id,
          });
        }
      });

      // Handle custom events
      socket.on("ping", () => {
        socket.emit("pong", {
          timestamp: new Date().toISOString(),
        });
      });

      socket.on("get_status", async () => {
        try {
          const status = await websocketService.getConnectionStatus(userId);
          socket.emit("status_response", status);
        } catch (error) {
          logger.error("❌ Get connection status failed", {
            error: error.message,
            userId,
          });
          socket.emit("error", {
            message: "Không thể lấy trạng thái kết nối",
            error: error.message,
          });
        }
      });
    } catch (error) {
      logger.error("❌ WebSocket connection handling failed", {
        error: error.message,
        userId,
        socketId: socket.id,
      });

      socket.emit("error", {
        message: "Kết nối WebSocket thất bại",
        error: error.message,
      });
    }
  },

  /**
   * Send real-time weight update
   */
  async sendWeightUpdate(userId, weightData) {
    try {
      const success = await websocketService.sendWeightUpdate(
        userId,
        weightData
      );

      if (success) {
        logger.info("✅ Weight update sent via WebSocket", {
          userId,
          weightId: weightData._id,
        });
      } else {
        logger.warn("⚠️ Weight update WebSocket failed", {
          userId,
          weightId: weightData._id,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send weight update via WebSocket failed", {
        error: error.message,
        userId,
        weightId: weightData._id,
      });
      return false;
    }
  },

  /**
   * Send real-time meal update
   */
  async sendMealUpdate(userId, mealData) {
    try {
      const success = await websocketService.sendMealUpdate(userId, mealData);

      if (success) {
        logger.info("✅ Meal update sent via WebSocket", {
          userId,
          mealId: mealData._id,
        });
      } else {
        logger.warn("⚠️ Meal update WebSocket failed", {
          userId,
          mealId: mealData._id,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send meal update via WebSocket failed", {
        error: error.message,
        userId,
        mealId: mealData._id,
      });
      return false;
    }
  },

  /**
   * Send real-time workout update
   */
  async sendWorkoutUpdate(userId, workoutData) {
    try {
      const success = await websocketService.sendWorkoutUpdate(
        userId,
        workoutData
      );

      if (success) {
        logger.info("✅ Workout update sent via WebSocket", {
          userId,
          workoutId: workoutData._id,
        });
      } else {
        logger.warn("⚠️ Workout update WebSocket failed", {
          userId,
          workoutId: workoutData._id,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send workout update via WebSocket failed", {
        error: error.message,
        userId,
        workoutId: workoutData._id,
      });
      return false;
    }
  },

  /**
   * Send real-time plan completion
   */
  async sendPlanCompletion(userId, planData) {
    try {
      const success = await websocketService.sendPlanCompletion(
        userId,
        planData
      );

      if (success) {
        logger.info("✅ Plan completion sent via WebSocket", {
          userId,
          planId: planData._id,
        });
      } else {
        logger.warn("⚠️ Plan completion WebSocket failed", {
          userId,
          planId: planData._id,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send plan completion via WebSocket failed", {
        error: error.message,
        userId,
        planId: planData._id,
      });
      return false;
    }
  },

  /**
   * Send real-time XP update
   */
  async sendXPUpdate(userId, xpData) {
    try {
      const success = await websocketService.sendXPUpdate(userId, xpData);

      if (success) {
        logger.info("✅ XP update sent via WebSocket", {
          userId,
          newXP: xpData.newXP,
          level: xpData.level,
        });
      } else {
        logger.warn("⚠️ XP update WebSocket failed", {
          userId,
          newXP: xpData.newXP,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send XP update via WebSocket failed", {
        error: error.message,
        userId,
        newXP: xpData.newXP,
      });
      return false;
    }
  },

  /**
   * Send real-time badge earned
   */
  async sendBadgeEarned(userId, badgeData) {
    try {
      const success = await websocketService.sendBadgeEarned(userId, badgeData);

      if (success) {
        logger.info("✅ Badge earned sent via WebSocket", {
          userId,
          badgeName: badgeData.name,
        });
      } else {
        logger.warn("⚠️ Badge earned WebSocket failed", {
          userId,
          badgeName: badgeData.name,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send badge earned via WebSocket failed", {
        error: error.message,
        userId,
        badgeName: badgeData.name,
      });
      return false;
    }
  },

  /**
   * Send real-time challenge update
   */
  async sendChallengeUpdate(userId, challengeData) {
    try {
      const success = await websocketService.sendChallengeUpdate(
        userId,
        challengeData
      );

      if (success) {
        logger.info("✅ Challenge update sent via WebSocket", {
          userId,
          challengeId: challengeData._id,
        });
      } else {
        logger.warn("⚠️ Challenge update WebSocket failed", {
          userId,
          challengeId: challengeData._id,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send challenge update via WebSocket failed", {
        error: error.message,
        userId,
        challengeId: challengeData._id,
      });
      return false;
    }
  },

  /**
   * Send real-time progress update
   */
  async sendProgressUpdate(userId, progressData) {
    try {
      const success = await websocketService.sendProgressUpdate(
        userId,
        progressData
      );

      if (success) {
        logger.info("✅ Progress update sent via WebSocket", {
          userId,
          progressType: progressData.type,
        });
      } else {
        logger.warn("⚠️ Progress update WebSocket failed", {
          userId,
          progressType: progressData.type,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send progress update via WebSocket failed", {
        error: error.message,
        userId,
        progressType: progressData.type,
      });
      return false;
    }
  },

  /**
   * Send real-time leaderboard update
   */
  async sendLeaderboardUpdate(challengeId, leaderboardData) {
    try {
      const success = await websocketService.sendLeaderboardUpdate(
        challengeId,
        leaderboardData
      );

      if (success) {
        logger.info("✅ Leaderboard update sent via WebSocket", {
          challengeId,
          participants: leaderboardData.participants?.length || 0,
        });
      } else {
        logger.warn("⚠️ Leaderboard update WebSocket failed", {
          challengeId,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send leaderboard update via WebSocket failed", {
        error: error.message,
        challengeId,
      });
      return false;
    }
  },

  /**
   * Send system maintenance notification
   */
  async sendSystemMaintenance(message, scheduledTime) {
    try {
      const success = await websocketService.sendSystemMaintenance(
        message,
        scheduledTime
      );

      if (success) {
        logger.info("✅ System maintenance notification sent via WebSocket", {
          message,
          scheduledTime,
        });
      } else {
        logger.warn("⚠️ System maintenance WebSocket failed", {
          message,
          scheduledTime,
        });
      }

      return success;
    } catch (error) {
      logger.error("❌ Send system maintenance via WebSocket failed", {
        error: error.message,
        message,
        scheduledTime,
      });
      return false;
    }
  },

  /**
   * Get WebSocket statistics
   */
  async getWebSocketStats(req, res) {
    try {
      const stats = await websocketService.getWebSocketStats();

      logger.info("✅ WebSocket statistics retrieved");

      res.json({
        success: true,
        message: "Thống kê WebSocket đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get WebSocket statistics failed", {
        error: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thống kê WebSocket thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get online users count
   */
  async getOnlineUsersCount(req, res) {
    try {
      const count = await websocketService.getOnlineUsersCount();

      logger.info("✅ Online users count retrieved", { count });

      res.json({
        success: true,
        message: "Số người dùng trực tuyến đã được lấy thành công",
        data: { onlineUsers: count },
      });
    } catch (error) {
      logger.error("❌ Get online users count failed", {
        error: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Lấy số người dùng trực tuyến thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = websocketController;
