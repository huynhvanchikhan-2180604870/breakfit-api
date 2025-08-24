const express = require("express");
const path = require("path");
require("dotenv").config();

// Import configurations and middleware
const databaseConfig = require("./config/database.config");
const aiConfig = require("./config/ai.config");
const basicMiddleware = require("./middleware/basic.middleware");
const errorHandler = require("./middleware/error-handler.middleware");
const logger = require("./utils/logger.util");

// Import routes
const apiRoutes = require("./routes");

/**
 * Main Express application
 * Modern ES7+ style with async/await and arrow functions
 */
const app = express();

/**
 * Initialize application middleware and routes
 */
const initializeApp = async () => {
  try {
    // Basic middleware setup
    app.use(basicMiddleware.helmet);
    app.use(basicMiddleware.cors);
    app.use(basicMiddleware.morgan);

    // Body parsing middleware
    app.use(express.json(basicMiddleware.bodyParser.json));
    app.use(express.urlencoded(basicMiddleware.bodyParser.urlencoded));

    // Static file serving for uploads
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // Initialize AI configuration
    aiConfig.initialize();

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || "1.0.0",
      });
    });

    // API status endpoint
    app.get("/api/status", async (req, res) => {
      try {
        const dbStatus = databaseConfig.getConnectionStatus();
        const dbStats = await databaseConfig.getDatabaseStats();
        const aiStatus = aiConfig.getStatus();

        res.json({
          status: "OK",
          timestamp: new Date().toISOString(),
          database: {
            connected: dbStatus,
            stats: dbStats,
          },
          ai: aiStatus,
          environment: process.env.NODE_ENV,
          version: process.env.npm_package_version || "1.0.0",
        });
      } catch (error) {
        logger.error("❌ Lỗi lấy API status:", error);
        res.status(500).json({
          status: "ERROR",
          message: "Không thể lấy thông tin hệ thống",
        });
      }
    });

    // Mount API routes
    app.use("/api/v1", apiRoutes);

    // 404 handler for undefined routes
    app.use(errorHandler.handleNotFound);

    // Global error handler (must be last)
    app.use(errorHandler.handleError);

    logger.info("✅ Express app đã được khởi tạo thành công!");
  } catch (error) {
    logger.error("❌ Lỗi khởi tạo Express app:", error);
    throw error;
  }
};

/**
 * Start the application
 */
const startApp = async () => {
  try {
    // Connect to database
    await databaseConfig.connect();

    // Initialize Express app
    await initializeApp();

    logger.info(" BreakFit API đã sẵn sàng!");

    // Return app object for server.js
    return { app };
  } catch (error) {
    logger.error("❌ Lỗi khởi động ứng dụng:", error);
    throw error;
  }
};

// Export for testing and external use
module.exports = { app, startApp };

// Auto-start if this file is run directly
if (require.main === module) {
  startApp();
}
