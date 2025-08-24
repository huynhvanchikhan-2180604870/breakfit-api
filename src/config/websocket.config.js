const { Server } = require("socket.io");
const logger = require("../utils/logger.util");

/**
 * WebSocket configuration for real-time features
 * Modern ES7+ style with arrow functions and destructuring
 */
const webSocketConfig = {
  io: null,
  port: process.env.WS_PORT || 3001,
  corsOrigin: process.env.WS_CORS_ORIGIN || "http://localhost:3000",

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer) {
    try {
      // Create Socket.io server with modern options
      this.io = new Server(httpServer, {
        cors: {
          origin: this.corsOrigin,
          methods: ["GET", "POST"],
          credentials: true,
        },
        transports: ["websocket", "polling"],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000,
      });

      this.setupEventListeners();

      logger.info("✅ WebSocket server đã khởi tạo thành công!", {
        port: this.port,
        corsOrigin: this.corsOrigin,
      });

      return this.io;
    } catch (error) {
      logger.error("❌ Lỗi khởi tạo WebSocket server:", error);
      throw error;
    }
  },

  /**
   * Setup WebSocket event listeners
   */
  setupEventListeners() {
    if (!this.io) return;

    // Connection event with arrow function
    this.io.on("connection", (socket) => {
      logger.info("🔌 Client đã kết nối WebSocket", {
        id: socket.id,
        address: socket.handshake.address,
      });

      // Event handlers with arrow functions
      socket.on("authenticate", (data) =>
        this.handleAuthentication(socket, data)
      );
      socket.on("join-user-room", (userId) =>
        this.joinUserRoom(socket, userId)
      );

      socket.on("disconnect", (reason) => {
        logger.info("�� Client đã ngắt kết nối WebSocket", {
          id: socket.id,
          reason,
        });
      });

      socket.on("error", (error) => {
        logger.error("❌ WebSocket error:", error);
      });
    });

    // Server events with arrow functions
    this.io.on("connect_error", (error) => {
      logger.error("❌ WebSocket connection error:", error);
    });

    this.io.on("connect_timeout", () => {
      logger.warn("⚠️ WebSocket connection timeout");
    });
  },

  /**
   * Handle user authentication
   */
  handleAuthentication(socket, { userId, token }) {
    try {
      if (userId && token) {
        // Destructuring assignment
        Object.assign(socket, { userId, authenticated: true });

        // Join user's personal room
        socket.join(`user:${userId}`);

        logger.info("🔐 User đã xác thực WebSocket", {
          socketId: socket.id,
          userId,
        });

        socket.emit("authenticated", { success: true });
      } else {
        socket.emit("authentication_error", {
          message: "Thông tin xác thực không hợp lệ",
        });
      }
    } catch (error) {
      logger.error("❌ Lỗi xác thực WebSocket:", error);
      socket.emit("authentication_error", {
        message: "Lỗi xác thực",
      });
    }
  },

  /**
   * Join user to their personal room
   */
  joinUserRoom(socket, userId) {
    try {
      socket.join(`user:${userId}`);
      logger.info("🏠 User đã tham gia room", {
        socketId: socket.id,
        userId,
        room: `user:${userId}`,
      });
    } catch (error) {
      logger.error("❌ Lỗi tham gia room:", error);
    }
  },

  /**
   * Send message to specific user
   */
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
      logger.info("�� Đã gửi message đến user", { userId, event });
    }
  },

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      logger.info("📢 Đã broadcast message đến tất cả clients", { event });
    }
  },

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.io ? this.io.engine.clientsCount : 0;
  },

  /**
   * Get server status with destructuring
   */
  getServerStatus() {
    const { isRunning, port, corsOrigin } = {
      isRunning: !!this.io,
      port: this.port,
      corsOrigin: this.corsOrigin,
    };

    return {
      isRunning,
      port,
      connectedClients: this.getConnectedClientsCount(),
      corsOrigin,
    };
  },
};

module.exports = webSocketConfig;
