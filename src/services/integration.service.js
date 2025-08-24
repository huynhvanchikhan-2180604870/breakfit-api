const Integration = require("../models/integration.model");
const User = require("../models/user.model");
const logger = require("../utils/logger.util");

/**
 * Integration service for external service connections
 * Handles API integrations, webhooks, and data synchronization
 */
const integrationService = {
  /**
   * Create new integration
   */
  async createIntegration(userId, integrationData) {
    try {
      // Validate required fields
      if (!integrationData.type || !integrationData.provider) {
        throw new Error("Integration type and provider are required");
      }

      // Check if integration already exists for user
      const existing = await Integration.findOne({
        userId,
        type: integrationData.type,
        provider: integrationData.provider,
      });

      if (existing) {
        throw new Error(
          "Integration already exists for this user and provider"
        );
      }

      // Create integration
      const integration = new Integration({
        ...integrationData,
        userId,
        status: "pending",
      });

      await integration.save();

      logger.info("✅ Integration created successfully", {
        userId,
        integrationId: integration._id,
        type: integration.type,
        provider: integration.provider,
      });

      return integration;
    } catch (error) {
      logger.error("❌ Failed to create integration", {
        error: error.message,
        userId,
        integrationData,
      });
      throw error;
    }
  },

  /**
   * Get user integrations
   */
  async getUserIntegrations(userId, options = {}) {
    try {
      const { type, status, limit = 50, page = 1 } = options;

      // Build query
      const query = { userId };
      if (type) query.type = type;
      if (status) query.status = status;

      // Execute query
      const integrations = await Integration.find(query)
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      // Get total count
      const total = await Integration.countDocuments(query);

      return {
        integrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("❌ Failed to get user integrations", {
        error: error.message,
        userId,
        options,
      });
      throw error;
    }
  },

  /**
   * Get integration by ID
   */
  async getIntegrationById(integrationId, userId) {
    try {
      const integration = await Integration.findOne({
        _id: integrationId,
        userId,
      });

      if (!integration) {
        throw new Error("Integration not found");
      }

      return integration;
    } catch (error) {
      logger.error("❌ Failed to get integration by ID", {
        error: error.message,
        integrationId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Update integration
   */
  async updateIntegration(integrationId, userId, updateData) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (key !== "userId" && key !== "_id") {
          integration[key] = updateData[key];
        }
      });

      integration.updatedAt = new Date();
      await integration.save();

      logger.info("✅ Integration updated successfully", {
        userId,
        integrationId,
        updatedFields: Object.keys(updateData),
      });

      return integration;
    } catch (error) {
      logger.error("❌ Failed to update integration", {
        error: error.message,
        integrationId,
        userId,
        updateData,
      });
      throw error;
    }
  },

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId, userId) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      await Integration.findByIdAndDelete(integrationId);

      logger.info("✅ Integration deleted successfully", {
        userId,
        integrationId,
        type: integration.type,
        provider: integration.provider,
      });

      return { success: true, message: "Integration deleted successfully" };
    } catch (error) {
      logger.error("❌ Failed to delete integration", {
        error: error.message,
        integrationId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Test integration connection
   */
  async testConnection(integrationId, userId) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      const result = await integration.testConnection();
      await integration.save();

      logger.info("✅ Integration connection tested successfully", {
        userId,
        integrationId,
        result,
      });

      return result;
    } catch (error) {
      logger.error("❌ Failed to test integration connection", {
        error: error.message,
        integrationId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Sync data from integration
   */
  async syncData(integrationId, userId, dataType = null) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      if (integration.status !== "active") {
        throw new Error("Integration is not active");
      }

      const result = await integration.syncData(dataType);
      await integration.save();

      logger.info("✅ Integration data synced successfully", {
        userId,
        integrationId,
        dataType,
        recordsProcessed: result.recordsProcessed,
      });

      return result;
    } catch (error) {
      logger.error("❌ Failed to sync integration data", {
        error: error.message,
        integrationId,
        userId,
        dataType,
      });
      throw error;
    }
  },

  /**
   * Trigger webhook
   */
  async triggerWebhook(integrationId, userId, event, data) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      const results = await integration.triggerWebhook(event, data);
      await integration.save();

      logger.info("✅ Webhook triggered successfully", {
        userId,
        integrationId,
        event,
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error("❌ Failed to trigger webhook", {
        error: error.message,
        integrationId,
        userId,
        event,
      });
      throw error;
    }
  },

  /**
   * Add webhook to integration
   */
  async addWebhook(integrationId, userId, webhookData) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      const webhook = integration.addWebhook(webhookData);
      await integration.save();

      logger.info("✅ Webhook added successfully", {
        userId,
        integrationId,
        webhookId: webhook._id,
        event: webhook.event,
      });

      return webhook;
    } catch (error) {
      logger.error("❌ Failed to add webhook", {
        error: error.message,
        integrationId,
        userId,
        webhookData,
      });
      throw error;
    }
  },

  /**
   * Remove webhook from integration
   */
  async removeWebhook(integrationId, userId, webhookId) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      const removed = integration.removeWebhook(webhookId);
      if (removed) {
        await integration.save();

        logger.info("✅ Webhook removed successfully", {
          userId,
          integrationId,
          webhookId,
        });

        return { success: true, message: "Webhook removed successfully" };
      } else {
        throw new Error("Webhook not found");
      }
    } catch (error) {
      logger.error("❌ Failed to remove webhook", {
        error: error.message,
        integrationId,
        userId,
        webhookId,
      });
      throw error;
    }
  },

  /**
   * Update integration credentials
   */
  async updateCredentials(integrationId, userId, credentials) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      integration.updateCredentials(credentials);
      await integration.save();

      logger.info("✅ Integration credentials updated successfully", {
        userId,
        integrationId,
        updatedFields: Object.keys(credentials),
      });

      return integration;
    } catch (error) {
      logger.error("❌ Failed to update integration credentials", {
        error: error.message,
        integrationId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get integration statistics
   */
  async getIntegrationStats(userId) {
    try {
      const userIntegrations = await Integration.find({ userId });

      const stats = {
        total: userIntegrations.length,
        active: userIntegrations.filter((i) => i.status === "active").length,
        inactive: userIntegrations.filter((i) => i.status === "inactive")
          .length,
        error: userIntegrations.filter((i) => i.status === "error").length,
        pending: userIntegrations.filter((i) => i.status === "pending").length,
        byType: {},
        byProvider: {},
        totalDataTransferred: 0,
        avgUptime: 0,
      };

      // Calculate type and provider breakdowns
      userIntegrations.forEach((integration) => {
        // By type
        if (!stats.byType[integration.type]) {
          stats.byType[integration.type] = 0;
        }
        stats.byType[integration.type]++;

        // By provider
        if (!stats.byProvider[integration.provider]) {
          stats.byProvider[integration.provider] = 0;
        }
        stats.byProvider[integration.provider]++;

        // Data and uptime
        stats.totalDataTransferred += integration.usage?.dataTransferred || 0;
        if (integration.healthCheck?.uptime) {
          stats.avgUptime += integration.healthCheck.uptime;
        }
      });

      if (userIntegrations.length > 0) {
        stats.avgUptime = stats.avgUptime / userIntegrations.length;
      }

      return stats;
    } catch (error) {
      logger.error("❌ Failed to get integration statistics", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get integrations with errors
   */
  async getIntegrationsWithErrors(userId, limit = 10) {
    try {
      const integrations = await Integration.find({
        userId,
        $or: [
          { status: "error" },
          { "errors.resolved": false },
          { "healthCheck.status": "unhealthy" },
        ],
      })
        .sort({ "errors.timestamp": -1 })
        .limit(limit);

      return integrations;
    } catch (error) {
      logger.error("❌ Failed to get integrations with errors", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Resolve integration error
   */
  async resolveError(integrationId, userId, errorId, resolvedBy) {
    try {
      const integration = await this.getIntegrationById(integrationId, userId);

      const error = integration.errors.id(errorId);
      if (!error) {
        throw new Error("Error not found");
      }

      error.resolved = true;
      error.resolvedAt = new Date();
      error.resolvedBy = resolvedBy;

      await integration.save();

      logger.info("✅ Integration error resolved successfully", {
        userId,
        integrationId,
        errorId,
        resolvedBy,
      });

      return error;
    } catch (error) {
      logger.error("❌ Failed to resolve integration error", {
        error: error.message,
        integrationId,
        userId,
        errorId,
      });
      throw error;
    }
  },

  /**
   * Get available integration types
   */
  async getAvailableTypes() {
    try {
      const types = [
        {
          type: "fitness_tracker",
          name: "Fitness Tracker",
          description: "Connect to fitness devices and apps",
          providers: ["Fitbit", "Garmin", "Apple Health", "Google Fit"],
          icon: "🏃‍♂️",
        },
        {
          type: "nutrition_app",
          name: "Nutrition App",
          description: "Sync nutrition and meal data",
          providers: ["MyFitnessPal", "Cronometer", "Lose It!", "FatSecret"],
          icon: "🍎",
        },
        {
          type: "social_media",
          name: "Social Media",
          description: "Share progress and connect with friends",
          providers: ["Instagram", "Facebook", "Twitter", "LinkedIn"],
          icon: "📱",
        },
        {
          type: "calendar",
          name: "Calendar",
          description: "Schedule workouts and track appointments",
          providers: ["Google Calendar", "Outlook", "Apple Calendar"],
          icon: "📅",
        },
        {
          type: "weather",
          name: "Weather",
          description: "Get weather data for outdoor activities",
          providers: ["OpenWeatherMap", "WeatherAPI", "AccuWeather"],
          icon: "🌤️",
        },
        {
          type: "payment",
          name: "Payment",
          description: "Process payments and subscriptions",
          providers: ["Stripe", "PayPal", "Square", "Apple Pay"],
          icon: "💳",
        },
        {
          type: "notification",
          name: "Notification",
          description: "Send push notifications and alerts",
          providers: ["Firebase", "OneSignal", "Pushwoosh"],
          icon: "🔔",
        },
        {
          type: "analytics",
          name: "Analytics",
          description: "Track user behavior and app performance",
          providers: ["Google Analytics", "Mixpanel", "Amplitude"],
          icon: "📊",
        },
        {
          type: "storage",
          name: "Storage",
          description: "Store files and media",
          providers: ["AWS S3", "Google Cloud", "Azure", "Dropbox"],
          icon: "💾",
        },
        {
          type: "ai_service",
          name: "AI Service",
          description: "Integrate with AI and machine learning",
          providers: ["OpenAI", "Google AI", "Azure AI", "AWS AI"],
          icon: "🤖",
        },
      ];

      return types;
    } catch (error) {
      logger.error("❌ Failed to get available integration types", {
        error: error.message,
      });
      throw error;
    }
  },
};

module.exports = integrationService;
