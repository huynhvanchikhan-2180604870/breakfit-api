const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger.util");

/**
 * AI configuration for Gemini integration
 * Handles AI model setup, caching, and confidence thresholds
 */
const aiConfig = {
  genAI: null,
  models: {
    geminiPro: null,
    geminiProVision: null,
  },

  // AI confidence thresholds
  thresholds: {
    confidenceMin: 0.7,
    confidenceWarning: 0.8,
    maxRetries: 3,
    retryDelayMs: 5000,
  },

  // Response caching (in production, use Redis)
  cache: new Map(),
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours

  /**
   * Initialize AI configuration
   */
  initialize() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.warn(
          "⚠️ GEMINI_API_KEY not found - AI features will be disabled"
        );
        return false;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.models.geminiPro = this.genAI.getGenerativeModel({
        model: "gemini-pro",
      });
      this.models.geminiProVision = this.genAI.getGenerativeModel({
        model: "gemini-pro-vision",
      });

      // Set up cache cleanup
      this.setupCacheCleanup();

      logger.info("✅ AI configuration initialized successfully");
      return true;
    } catch (error) {
      logger.error("❌ AI configuration initialization failed:", error);
      return false;
    }
  },

  /**
   * Get AI model
   */
  getModel(modelType = "geminiPro") {
    return this.models[modelType];
  },

  /**
   * Check if AI is available
   */
  isAvailable() {
    return !!this.genAI && !!this.models.geminiPro;
  },

  /**
   * Get AI status
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      models: Object.keys(this.models).filter((key) => this.models[key]),
      provider: "Google Gemini",
      thresholds: this.thresholds,
      cacheSize: this.cache.size,
      cacheTTL: this.cacheTTL,
    };
  },

  /**
   * Get cached response
   */
  getCachedResponse(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Remove expired cache
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  },

  /**
   * Set cached response
   */
  setCachedResponse(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  },

  /**
   * Generate cache key
   */
  generateCacheKey(photoId, analysisType, userId) {
    return `ai_${analysisType}_${photoId}_${userId}`;
  },

  /**
   * Validate AI confidence
   */
  validateConfidence(confidence) {
    if (confidence < this.thresholds.confidenceMin) {
      throw new Error(
        `AI confidence too low: ${confidence}. Minimum required: ${this.thresholds.confidenceMin}`
      );
    }

    if (confidence < this.thresholds.confidenceWarning) {
      logger.warn(`⚠️ Low AI confidence: ${confidence}`, {
        threshold: this.thresholds.confidenceWarning,
      });
    }

    return true;
  },

  /**
   * Setup cache cleanup
   */
  setupCacheCleanup() {
    // Clean up expired cache every hour
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, value] of this.cache) {
        if (now - value.timestamp > this.cacheTTL) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`🧹 Cleaned up ${cleanedCount} expired AI cache entries`);
      }
    }, 60 * 60 * 1000); // Every hour
  },

  /**
   * Update confidence thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info("✅ AI confidence thresholds updated", this.thresholds);
  },

  /**
   * Get configuration summary
   */
  getConfig() {
    return {
      models: Object.keys(this.models).filter((key) => this.models[key]),
      thresholds: this.thresholds,
      cache: {
        size: this.cache.size,
        ttl: this.cacheTTL,
        enabled: true,
      },
      features: {
        mealAnalysis: true,
        bodyAnalysis: true,
        nutritionRecommendations: true,
        workoutRecommendations: true,
        progressInsights: true,
        asyncProcessing: true,
        caching: true,
        confidenceValidation: true,
      },
    };
  },
};

module.exports = aiConfig;
