const http = require("http");
const { startApp } = require("./app");
const webSocketConfig = require("./config/websocket.config");
const logger = require("./utils/logger.util");

/**
 * HTTP server setup with WebSocket integration
 * Modern ES7+ style with arrow functions and destructuring
 */
const startServer = async () => {
  try {
    // Start Express app
    const { app } = await startApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket server
    const io = webSocketConfig.initialize(server);

    // Get port from environment
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || "localhost";

    // Start server
    server.listen(port, host, () => {
      logger.info(" HTTP Server đã khởi động thành công!", {
        host,
        port,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });

      // Log server information
      logger.info(" Server Information:", {
        baseUrl: `http://${host}:${port}`,
        healthCheck: `http://${host}:${port}/health`,
        apiStatus: `http://${host}:${port}/api/status`,
        uploads: `http://${host}:${port}/uploads`,
        websocket: `ws://${host}:${webSocketConfig.port || port}`,
      });
    });

    // Server error handling
    server.on("error", (error) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

      switch (error.code) {
        case "EACCES":
          logger.error(`❌ ${bind} yêu cầu quyền truy cập cao hơn`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          logger.error(`❌ ${bind} đã được sử dụng`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`🔄 Nhận tín hiệu ${signal}, đang đóng server...`);

      server.close(async () => {
        logger.info("✅ HTTP server đã đóng");

        try {
          // Close WebSocket connections
          if (io) {
            io.close(() => {
              logger.info("✅ WebSocket server đã đóng");
            });
          }

          // Close database connection
          const databaseConfig = require("./config/database.config");
          await databaseConfig.disconnect();

          logger.info("✅ Tất cả kết nối đã đóng, thoát ứng dụng");
          process.exit(0);
        } catch (error) {
          logger.error("❌ Lỗi trong quá trình đóng ứng dụng:", error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error("❌ Không thể đóng ứng dụng gracefully, force exit");
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    return { server, io };
  } catch (error) {
    logger.error("❌ Lỗi khởi động server:", error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
