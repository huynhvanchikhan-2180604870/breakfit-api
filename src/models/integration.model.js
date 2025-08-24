const mongoose = require("mongoose");

/**
 * Integration model for external service connections
 * Handles API keys, webhooks, and service configurations
 */
const integrationSchema = new mongoose.Schema(
  {
    // User association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Integration Type & Status
    type: {
      type: String,
      enum: [
        "fitness_tracker", // Fitbit, Garmin, Apple Health
        "nutrition_app", // MyFitnessPal, Cronometer
        "social_media", // Instagram, Facebook, Twitter
        "calendar", // Google Calendar, Outlook
        "weather", // OpenWeatherMap, WeatherAPI
        "payment", // Stripe, PayPal
        "notification", // Push notifications, SMS
        "analytics", // Google Analytics, Mixpanel
        "storage", // AWS S3, Google Cloud
        "ai_service", // OpenAI, Google AI
        "custom", // Custom integrations
      ],
      required: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "error", "pending", "disconnected"],
      default: "pending",
    },

    // Authentication & Credentials
    credentials: {
      apiKey: String,
      apiSecret: String,
      accessToken: String,
      refreshToken: String,
      expiresAt: Date,
      clientId: String,
      clientSecret: String,
      redirectUri: String,
    },

    // Configuration & Settings
    config: {
      syncInterval: {
        type: Number,
        default: 3600, // seconds
      },
      autoSync: {
        type: Boolean,
        default: true,
      },
      dataTypes: [String], // Types of data to sync
      webhookUrl: String,
      webhookSecret: String,
      rateLimit: {
        requests: Number,
        window: Number, // seconds
      },
      retryConfig: {
        maxRetries: { type: Number, default: 3 },
        backoffMultiplier: { type: Number, default: 2 },
        initialDelay: { type: Number, default: 1000 }, // ms
      },
    },

    // Data Mapping & Transformation
    dataMapping: {
      sourceFields: [String],
      targetFields: [String],
      transformations: [
        {
          sourceField: String,
          targetField: String,
          transformType: {
            type: String,
            enum: ["copy", "convert", "calculate", "format"],
          },
          transformConfig: mongoose.Schema.Types.Mixed,
        },
      ],
      filters: [
        {
          field: String,
          operator: {
            type: String,
            enum: [
              "equals",
              "not_equals",
              "greater_than",
              "less_than",
              "contains",
            ],
          },
          value: mongoose.Schema.Types.Mixed,
        },
      ],
    },

    // Sync History & Status
    lastSync: {
      timestamp: Date,
      status: String,
      recordsProcessed: Number,
      recordsCreated: Number,
      recordsUpdated: Number,
      recordsFailed: Number,
      errorMessage: String,
      duration: Number, // milliseconds
    },
    syncHistory: [
      {
        timestamp: Date,
        status: String,
        recordsProcessed: Number,
        recordsCreated: Number,
        recordsUpdated: Number,
        recordsFailed: Number,
        errorMessage: String,
        duration: Number,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],

    // Webhook & Event Handling
    webhooks: [
      {
        event: String,
        url: String,
        method: {
          type: String,
          enum: ["GET", "POST", "PUT", "DELETE"],
          default: "POST",
        },
        headers: mongoose.Schema.Types.Mixed,
        body: mongoose.Schema.Types.Mixed,
        active: {
          type: Boolean,
          default: true,
        },
        lastTriggered: Date,
        successCount: { type: Number, default: 0 },
        failureCount: { type: Number, default: 0 },
      },
    ],

    // Error Handling & Monitoring
    errors: [
      {
        timestamp: Date,
        type: String,
        message: String,
        stack: String,
        metadata: mongoose.Schema.Types.Mixed,
        resolved: {
          type: Boolean,
          default: false,
        },
        resolvedAt: Date,
        resolvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    healthCheck: {
      lastCheck: Date,
      status: String,
      responseTime: Number,
      uptime: Number, // percentage
      errorRate: Number, // percentage
    },

    // Usage & Analytics
    usage: {
      totalRequests: { type: Number, default: 0 },
      successfulRequests: { type: Number, default: 0 },
      failedRequests: { type: Number, default: 0 },
      lastRequest: Date,
      dataTransferred: Number, // bytes
      cost: {
        amount: Number,
        currency: { type: String, default: "USD" },
        lastBilling: Date,
      },
    },

    // Security & Compliance
    security: {
      encryptionEnabled: { type: Boolean, default: true },
      encryptionMethod: String,
      dataRetention: Number, // days
      gdprCompliant: { type: Boolean, default: false },
      auditLog: [
        {
          timestamp: Date,
          action: String,
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          ipAddress: String,
          userAgent: String,
          details: mongoose.Schema.Types.Mixed,
        },
      ],
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
integrationSchema.index({ userId: 1, type: 1 });
integrationSchema.index({ provider: 1, status: 1 });
integrationSchema.index({ "lastSync.timestamp": -1 });
integrationSchema.index({ "healthCheck.status": 1 });

// Virtuals
integrationSchema.virtual("isHealthy").get(function () {
  return this.healthCheck?.status === "healthy";
});

integrationSchema.virtual("syncStatus").get(function () {
  if (!this.lastSync) return "never";
  const now = new Date();
  const lastSync = new Date(this.lastSync.timestamp);
  const diffHours = (now - lastSync) / (1000 * 60 * 60);

  if (diffHours < 1) return "recent";
  if (diffHours < 24) return "today";
  if (diffHours < 168) return "this_week";
  return "old";
});

integrationSchema.virtual("errorRate").get(function () {
  if (this.usage.totalRequests === 0) return 0;
  return (this.usage.failedRequests / this.usage.totalRequests) * 100;
});

// Pre-save middleware
integrationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
integrationSchema.methods = {
  /**
   * Test connection to external service
   */
  async testConnection() {
    try {
      // This would implement actual connection testing
      // For now, return a mock result
      const isConnected = this.status === "active";

      this.healthCheck = {
        lastCheck: new Date(),
        status: isConnected ? "healthy" : "unhealthy",
        responseTime: isConnected ? Math.random() * 1000 : null,
        uptime: isConnected ? 95 + Math.random() * 5 : 0,
        errorRate: isConnected ? Math.random() * 5 : 100,
      };

      return {
        success: isConnected,
        status: this.healthCheck.status,
        responseTime: this.healthCheck.responseTime,
      };
    } catch (error) {
      this.healthCheck = {
        lastCheck: new Date(),
        status: "error",
        errorRate: 100,
      };
      throw error;
    }
  },

  /**
   * Sync data from external service
   */
  async syncData(dataType = null) {
    try {
      const startTime = Date.now();
      const syncStart = new Date();

      // Mock sync process
      const recordsProcessed = Math.floor(Math.random() * 100) + 10;
      const recordsCreated = Math.floor(Math.random() * recordsProcessed * 0.3);
      const recordsUpdated = Math.floor(Math.random() * recordsProcessed * 0.5);
      const recordsFailed = Math.floor(Math.random() * 5);

      const syncResult = {
        timestamp: syncStart,
        status: recordsFailed === 0 ? "success" : "partial",
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errorMessage: recordsFailed > 0 ? "Some records failed to sync" : null,
        duration: Date.now() - startTime,
        metadata: { dataType, syncMethod: "api" },
      };

      this.lastSync = syncResult;
      this.syncHistory.push(syncResult);

      // Update usage stats
      this.usage.totalRequests++;
      this.usage.successfulRequests++;
      this.usage.lastRequest = new Date();

      return syncResult;
    } catch (error) {
      const syncResult = {
        timestamp: new Date(),
        status: "error",
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        errorMessage: error.message,
        duration: 0,
        metadata: { dataType },
      };

      this.lastSync = syncResult;
      this.syncHistory.push(syncResult);

      // Update usage stats
      this.usage.totalRequests++;
      this.usage.failedRequests++;
      this.usage.lastRequest = new Date();

      // Log error
      this.errors.push({
        timestamp: new Date(),
        type: "sync_error",
        message: error.message,
        stack: error.stack,
        metadata: { dataType },
      });

      throw error;
    }
  },

  /**
   * Trigger webhook for specific event
   */
  async triggerWebhook(event, data) {
    const webhooks = this.webhooks.filter((w) => w.event === event && w.active);

    const results = [];

    for (const webhook of webhooks) {
      try {
        // Mock webhook call
        const success = Math.random() > 0.1; // 90% success rate

        if (success) {
          webhook.successCount++;
          webhook.lastTriggered = new Date();
          results.push({
            webhookId: webhook._id,
            status: "success",
            timestamp: new Date(),
          });
        } else {
          webhook.failureCount++;
          results.push({
            webhookId: webhook._id,
            status: "failed",
            timestamp: new Date(),
            error: "Webhook call failed",
          });
        }
      } catch (error) {
        webhook.failureCount++;
        results.push({
          webhookId: webhook._id,
          status: "error",
          timestamp: new Date(),
          error: error.message,
        });
      }
    }

    return results;
  },

  /**
   * Update credentials
   */
  updateCredentials(newCredentials) {
    this.credentials = { ...this.credentials, ...newCredentials };
    this.updatedAt = new Date();
    return this;
  },

  /**
   * Add webhook
   */
  addWebhook(webhookData) {
    const webhook = {
      ...webhookData,
      active: true,
      lastTriggered: null,
      successCount: 0,
      failureCount: 0,
    };
    this.webhooks.push(webhook);
    return webhook;
  },

  /**
   * Remove webhook
   */
  removeWebhook(webhookId) {
    const index = this.webhooks.findIndex(
      (w) => w._id.toString() === webhookId
    );
    if (index !== -1) {
      this.webhooks.splice(index, 1);
      return true;
    }
    return false;
  },

  /**
   * Log audit event
   */
  logAuditEvent(action, userId, ipAddress, userAgent, details = {}) {
    this.security.auditLog.push({
      timestamp: new Date(),
      action,
      userId,
      ipAddress,
      userAgent,
      details,
    });

    // Keep only last 100 audit log entries
    if (this.security.auditLog.length > 100) {
      this.security.auditLog = this.security.auditLog.slice(-100);
    }

    return this;
  },
};

// Static methods
integrationSchema.statics = {
  /**
   * Get integrations by type
   */
  async getByType(type, limit = 50) {
    return this.find({ type, status: "active" })
      .limit(limit)
      .sort({ updatedAt: -1 });
  },

  /**
   * Get integrations by provider
   */
  async getByProvider(provider, limit = 50) {
    return this.find({ provider, status: "active" })
      .limit(limit)
      .sort({ updatedAt: -1 });
  },

  /**
   * Get integrations with errors
   */
  async getWithErrors(limit = 50) {
    return this.find({
      $or: [
        { status: "error" },
        { "errors.resolved": false },
        { "healthCheck.status": "unhealthy" },
      ],
    })
      .limit(limit)
      .sort({ "errors.timestamp": -1 });
  },

  /**
   * Get integration statistics
   */
  async getStatistics() {
    return this.aggregate([
      {
        $group: {
          _id: null,
          totalIntegrations: { $sum: 1 },
          activeIntegrations: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          errorIntegrations: {
            $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] },
          },
          avgUptime: { $avg: "$healthCheck.uptime" },
          totalDataTransferred: { $sum: "$usage.dataTransferred" },
        },
      },
    ]);
  },
};

module.exports = mongoose.model("Integration", integrationSchema);
