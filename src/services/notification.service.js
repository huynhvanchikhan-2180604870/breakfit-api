const { Expo } = require("expo-server-sdk");
const User = require("../models/user.model");
const Event = require("../models/event.model");
const logger = require("../utils/logger.util");

/**
 * Notification service for push notifications and reminders
 * Handles Expo push notifications and local reminders
 */
const notificationService = {
  /**
   * Initialize Expo SDK
   */
  expo: new Expo({ accessToken: process.env.EXPO_PUSH_ACCESS_TOKEN }),

  /**
   * Notification templates
   */
  templates: {
    // Weight tracking
    weight_reminder: {
      title: "⏰ Nhắc nhở cân nặng",
      body: "Đã đến lúc ghi nhận cân nặng hôm nay rồi!",
      data: { type: "weight_reminder" },
    },
    weight_goal_reached: {
      title: "�� Chúc mừng!",
      body: "Bạn đã đạt được mục tiêu cân nặng!",
      data: { type: "weight_goal_reached" },
    },

    // Workout reminders
    workout_reminder: {
      title: "�� Nhắc nhở tập luyện",
      body: "Đã đến giờ tập luyện rồi! Hãy duy trì thói quen tốt.",
      data: { type: "workout_reminder" },
    },
    workout_completed: {
      title: "✅ Hoàn thành!",
      body: "Chúc mừng bạn đã hoàn thành buổi tập!",
      data: { type: "workout_completed" },
    },

    // Streak notifications
    streak_milestone: {
      title: "🔥 Streak mới!",
      body: "Bạn đã duy trì được {days} ngày liên tiếp!",
      data: { type: "streak_milestone" },
    },
    streak_broken: {
      title: "💔 Streak bị gián đoạn",
      body: "Đừng bỏ cuộc! Hãy bắt đầu lại streak mới.",
      data: { type: "streak_broken" },
    },

    // Level up
    level_up: {
      title: "🎉 Level Up!",
      body: "Chúc mừng! Bạn đã lên level {level}!",
      data: { type: "level_up" },
    },

    // Badge earned
    badge_earned: {
      title: "�� Badge mới!",
      body: "Bạn đã nhận được badge: {badge_name}",
      data: { type: "badge_earned" },
    },

    // Challenge notifications
    challenge_reminder: {
      title: "�� Nhắc nhở Challenge",
      body: "Challenge của bạn sắp kết thúc! Hãy hoàn thành nốt.",
      data: { type: "challenge_reminder" },
    },
    challenge_completed: {
      title: "🎊 Challenge hoàn thành!",
      body: "Tuyệt vời! Bạn đã hoàn thành challenge!",
      data: { type: "challenge_completed" },
    },

    // General motivation
    daily_motivation: {
      title: "�� Lời nhắn động viên",
      body: "Hôm nay là ngày mới! Hãy tiếp tục hành trình giảm cân của bạn.",
      data: { type: "daily_motivation" },
    },
  },

  /**
   * Send push notification to user
   */
  async sendPushNotification(userId, templateKey, data = {}) {
    try {
      // Get user's push tokens
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // TODO: Get user's push tokens from device collection
      // For now, we'll use a placeholder
      const pushTokens = []; // await this.getUserPushTokens(userId);

      if (pushTokens.length === 0) {
        logger.warn("⚠️ No push tokens found for user", { userId });
        return { sent: 0, errors: [] };
      }

      // Get template
      const template = this.templates[templateKey];
      if (!template) {
        throw new Error(`Notification template '${templateKey}' not found`);
      }

      // Prepare messages
      const messages = pushTokens
        .map((token) => {
          if (!Expo.isExpoPushToken(token)) {
            logger.warn("⚠️ Invalid Expo push token", { token });
            return null;
          }

          return {
            to: token,
            sound: "default",
            title: this.interpolateTemplate(template.title, data),
            body: this.interpolateTemplate(template.body, data),
            data: { ...template.data, ...data, userId },
          };
        })
        .filter(Boolean);

      if (messages.length === 0) {
        return { sent: 0, errors: [] };
      }

      // Send notifications
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error("❌ Failed to send push notification chunk", {
            error: error.message,
          });
        }
      }

      // Log event
      await Event.createEvent(
        userId,
        "notification.sent",
        "Push notification sent",
        `Sent ${templateKey} notification`,
        { templateKey, data, ticketsCount: tickets.length },
        { userId }
      );

      logger.info("✅ Push notifications sent", {
        userId,
        templateKey,
        sent: tickets.length,
      });

      return { sent: tickets.length, tickets };
    } catch (error) {
      logger.error("❌ Push notification failed", {
        error: error.message,
        userId,
        templateKey,
      });
      throw error;
    }
  },

  /**
   * Send notification to multiple users
   */
  async sendBulkNotifications(userIds, templateKey, data = {}) {
    try {
      const results = [];

      for (const userId of userIds) {
        try {
          const result = await this.sendPushNotification(
            userId,
            templateKey,
            data
          );
          results.push({ userId, success: true, result });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      logger.info("✅ Bulk notifications completed", {
        total: userIds.length,
        success: successCount,
        failure: failureCount,
      });

      return { results, successCount, failureCount };
    } catch (error) {
      logger.error("❌ Bulk notifications failed", { error: error.message });
      throw error;
    }
  },

  /**
   * Send daily reminders
   */
  async sendDailyReminders() {
    try {
      // Get users who should receive daily reminders
      const users = await User.find({ isActive: true });
      const reminderUsers = [];

      for (const user of users) {
        try {
          // Check user's reminder preferences
          const shouldSend = await this.shouldSendReminder(user._id, "daily");
          if (shouldSend) {
            reminderUsers.push(user._id);
          }
        } catch (error) {
          logger.warn("⚠️ Failed to check reminder preferences", {
            userId: user._id,
            error: error.message,
          });
        }
      }

      // Send daily motivation
      await this.sendBulkNotifications(reminderUsers, "daily_motivation");

      logger.info("✅ Daily reminders sent", { count: reminderUsers.length });

      return { sent: reminderUsers.length };
    } catch (error) {
      logger.error("❌ Daily reminders failed", { error: error.message });
      throw error;
    }
  },

  /**
   * Send weight reminder
   */
  async sendWeightReminder(userId) {
    try {
      await this.sendPushNotification(userId, "weight_reminder");

      logger.info("✅ Weight reminder sent", { userId });

      return { success: true };
    } catch (error) {
      logger.error("❌ Weight reminder failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Send workout reminder
   */
  async sendWorkoutReminder(userId) {
    try {
      await this.sendPushNotification(userId, "workout_reminder");

      logger.info("✅ Workout reminder sent", { userId });

      return { success: true };
    } catch (error) {
      logger.error("❌ Workout reminder failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Send streak milestone notification
   */
  async sendStreakMilestone(userId, streakDays) {
    try {
      await this.sendPushNotification(userId, "streak_milestone", {
        days: streakDays,
      });

      logger.info("✅ Streak milestone notification sent", {
        userId,
        streakDays,
      });

      return { success: true };
    } catch (error) {
      logger.error("❌ Streak milestone notification failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Send level up notification
   */
  async sendLevelUpNotification(userId, newLevel) {
    try {
      await this.sendPushNotification(userId, "level_up", { level: newLevel });

      logger.info("✅ Level up notification sent", { userId, newLevel });

      return { success: true };
    } catch (error) {
      logger.error("❌ Level up notification failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Send badge earned notification
   */
  async sendBadgeEarnedNotification(userId, badgeName) {
    try {
      await this.sendPushNotification(userId, "badge_earned", {
        badge_name: badgeName,
      });

      logger.info("✅ Badge earned notification sent", { userId, badgeName });

      return { success: true };
    } catch (error) {
      logger.error("❌ Badge earned notification failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Check receipt status
   */
  async checkReceiptStatus(receiptIds) {
    try {
      const receiptIdChunks =
        this.expo.chunkPushNotificationReceiptIds(receiptIds);
      const receipts = [];

      for (const chunk of receiptIdChunks) {
        try {
          const receiptChunk = await this.expo.getPushNotificationReceiptsAsync(
            chunk
          );
          receipts.push(...Object.values(receiptChunk));
        } catch (error) {
          logger.error("❌ Failed to check receipt chunk", {
            error: error.message,
          });
        }
      }

      return receipts;
    } catch (error) {
      logger.error("❌ Receipt status check failed", { error: error.message });
      throw error;
    }
  },

  /**
   * Interpolate template with data
   */
  interpolateTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  },

  /**
   * Check if user should receive reminder
   */
  async shouldSendReminder(userId, reminderType) {
    try {
      // TODO: Implement reminder preference checking
      // This would check user's reminder settings and last notification time
      return true; // Placeholder
    } catch (error) {
      logger.error("❌ Reminder preference check failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  },

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Event.aggregate([
        {
          $match: {
            userId: new require("mongoose").Types.ObjectId(userId),
            type: "notification.sent",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$metadata.templateKey",
            count: { $sum: 1 },
            lastSent: { $max: "$createdAt" },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      return stats;
    } catch (error) {
      logger.error("❌ Get notification stats failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};

module.exports = notificationService;
