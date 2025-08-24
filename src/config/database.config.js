const mongoose = require("mongoose");
const logger = require("../utils/logger.util");

/**
 * Database configuration for MongoDB connection
 * Modern ES7+ style with arrow functions and destructuring
 */
const databaseConfig = {
  isConnected: false,
  connectionString:
    process.env.MONGO_URI || "mongodb://localhost:27017/breakfit",

  // MongoDB connection options - Updated for newer versions
  options: {
    // Removed deprecated options for MongoDB Driver 4.0+
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },

  /**
   * Connect to MongoDB database
   */
  async connect() {
    try {
      await mongoose.connect(this.connectionString, this.options);

      this.isConnected = true;
      logger.info("✅ Kết nối MongoDB thành công!", {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      });

      this.setupEventListeners();
    } catch (error) {
      logger.error("❌ Lỗi kết nối MongoDB:", error);
      throw error;
    }
  },

  /**
   * Disconnect from MongoDB database
   */
  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info("✅ Đã ngắt kết nối MongoDB");
      }
    } catch (error) {
      logger.error("❌ Lỗi ngắt kết nối MongoDB:", error);
      throw error;
    }
  },

  /**
   * Setup MongoDB connection event listeners
   */
  setupEventListeners() {
    const { connection } = mongoose;

    // Connection events with arrow functions
    connection.on("connected", () => {
      logger.info(" MongoDB đã kết nối");
    });

    connection.on("disconnected", () => {
      this.isConnected = false;
      logger.warn("⚠️ MongoDB đã ngắt kết nối");
    });

    connection.on("reconnected", () => {
      this.isConnected = true;
      logger.info(" MongoDB đã kết nối lại");
    });

    connection.on("error", (error) => {
      logger.error("❌ Lỗi MongoDB:", error);
    });

    // Graceful shutdown with arrow functions
    const gracefulShutdown = async () => {
      logger.info("🔄 Đang đóng kết nối MongoDB...");
      await this.disconnect();
      process.exit(0);
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  },

  /**
   * Get database connection status
   */
  getConnectionStatus() {
    return this.isConnected && mongoose.connection.readyState === 1;
  },

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const stats = await mongoose.connection.db.stats();
      return {
        database: mongoose.connection.name,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
      };
    } catch (error) {
      logger.error("❌ Lỗi lấy thống kê database:", error);
      return null;
    }
  },
};

module.exports = databaseConfig;
