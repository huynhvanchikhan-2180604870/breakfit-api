const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");
const logger = require("./utils/logger.util");
const websocketController = require("./controllers/websocket.controller");

/**
 * WebSocket server setup for real-time communication
 * Handles mobile app connections, authentication, and real-time updates
 */
class WebSocketServer {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    try {
      // Create Socket.IO server
      this.io = new Server(server, {
        cors: {
          origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://breakfit.app",
            "https://www.breakfit.app",
          ],
          methods: ["GET", "POST"],
          credentials: true,
        },
        transports: ["websocket", "polling"],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 10000,
        maxHttpBufferSize: 1e6, // 1MB
      });

      // Setup event handlers
      this.setupEventHandlers();

      logger.info("✅ WebSocket server initialized successfully");

      return this.io;
    } catch (error) {
      logger.error("❌ WebSocket server initialization failed", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    // Connection event
    this.io.on("connection", async (socket) => {
      try {
        logger.info("🔌 New WebSocket connection", {
          socketId: socket.id,
          ip: socket.handshake.address,
          userAgent: socket.handshake.headers["user-agent"],
        });

        // Handle authentication
        await this.handleAuthentication(socket);

        // Setup socket event handlers
        this.setupSocketEventHandlers(socket);

        // Handle disconnection
        socket.on("disconnect", () => {
          this.handleDisconnection(socket);
        });
      } catch (error) {
        logger.error("❌ WebSocket connection setup failed", {
          error: error.message,
          socketId: socket.id,
        });

        socket.emit("error", {
          message: "Kết nối WebSocket thất bại",
          code: "CONNECTION_ERROR",
        });
      }
    });

    // Error handling
    this.io.on("error", (error) => {
      logger.error("❌ WebSocket server error", {
        error: error.message,
      });
    });
  }

  /**
   * Handle WebSocket authentication
   */
  async handleAuthentication(socket) {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        // Allow anonymous connections for public events
        socket.emit("auth_status", {
          authenticated: false,
          message: "Kết nối ẩn danh được chấp nhận",
        });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-passwordHash");

      if (!user || !user.isActive) {
        socket.emit("auth_error", {
          message: "Token không hợp lệ hoặc tài khoản đã bị khóa",
          code: "AUTH_ERROR",
        });
        return;
      }

      // Store user information in socket
      socket.userId = user._id;
      socket.user = user;

      // Update connection maps
      this.connectedClients.set(user._id.toString(), socket.id);
      this.socketUsers.set(socket.id, user._id.toString());

      // Join user to personal room
      socket.join(`user:${user._id}`);

      // Emit authentication success
      socket.emit("auth_success", {
        message: "Xác thực WebSocket thành công",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
      });

      // Emit connection status
      socket.emit("connection_status", {
        connected: true,
        userId: user._id,
        timestamp: new Date().toISOString(),
      });

      logger.info("✅ WebSocket authentication successful", {
        socketId: socket.id,
        userId: user._id,
        email: user.email,
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        socket.emit("auth_error", {
          message: "Token đã hết hạn. Vui lòng đăng nhập lại",
          code: "TOKEN_EXPIRED",
        });
      } else if (error.name === "JsonWebTokenError") {
        socket.emit("auth_error", {
          message: "Token không hợp lệ",
          code: "INVALID_TOKEN",
        });
      } else {
        socket.emit("auth_error", {
          message: "Xác thực thất bại",
          code: "AUTH_ERROR",
        });
      }

      logger.error("❌ WebSocket authentication failed", {
        error: error.message,
        socketId: socket.id,
      });
    }
  }

  /**
   * Setup individual socket event handlers
   */
  setupSocketEventHandlers(socket) {
    // Ping/Pong for connection health
    socket.on("ping", () => {
      socket.emit("pong", {
        timestamp: new Date().toISOString(),
      });
    });

    // Get connection status
    socket.on("get_status", () => {
      const status = {
        connected: true,
        userId: socket.userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      };
      socket.emit("status_response", status);
    });

    // Join challenge room
    socket.on("join_challenge", (challengeId) => {
      if (socket.userId) {
        socket.join(`challenge:${challengeId}`);
        socket.emit("challenge_joined", {
          challengeId,
          message: "Đã tham gia challenge room",
        });
      }
    });

    // Leave challenge room
    socket.on("leave_challenge", (challengeId) => {
      if (socket.userId) {
        socket.leave(`challenge:${challengeId}`);
        socket.emit("challenge_left", {
          challengeId,
          message: "Đã rời challenge room",
        });
      }
    });

    // Join workout room
    socket.on("join_workout", (workoutId) => {
      if (socket.userId) {
        socket.join(`workout:${workoutId}`);
        socket.emit("workout_joined", {
          workoutId,
          message: "Đã tham gia workout room",
        });
      }
    });

    // Leave workout room
    socket.on("leave_workout", (workoutId) => {
      if (socket.userId) {
        socket.leave(`workout:${workoutId}`);
        socket.emit("workout_left", {
          workoutId,
          message: "Đã rời workout room",
        });
      }
    });

    // Get online users count
    socket.on("get_online_count", () => {
      const count = this.getConnectedClientsCount();
      socket.emit("online_count", { count });
    });

    // Get server status
    socket.on("get_server_status", () => {
      const status = this.getServerStatus();
      socket.emit("server_status", status);
    });

    // Custom message handling
    socket.on("message", (data) => {
      logger.info("📨 WebSocket message received", {
        socketId: socket.id,
        userId: socket.userId,
        message: data,
      });

      // Echo message back (for testing)
      socket.emit("message", {
        ...data,
        echo: true,
        timestamp: new Date().toISOString(),
      });
    });

    // Error handling
    socket.on("error", (error) => {
      logger.error("❌ Socket error", {
        error: error.message,
        socketId: socket.id,
        userId: socket.userId,
      });
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket) {
    try {
      if (socket.userId) {
        // Remove from connection maps
        this.connectedClients.delete(socket.userId.toString());
        this.socketUsers.delete(socket.id);

        logger.info("🔌 WebSocket disconnected", {
          socketId: socket.id,
          userId: socket.userId,
        });

        // Emit user offline event to other users
        socket.broadcast.emit("user_offline", {
          userId: socket.userId,
          timestamp: new Date().toISOString(),
        });
      } else {
        logger.info("🔌 Anonymous WebSocket disconnected", {
          socketId: socket.id,
        });
      }
    } catch (error) {
      logger.error("❌ WebSocket disconnection handling failed", {
        error: error.message,
        socketId: socket.id,
        userId: socket.userId,
      });
    }
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, event, data) {
    try {
      const socketId = this.connectedClients.get(userId.toString());
      if (socketId) {
        this.io.to(socketId).emit(event, data);
        return true;
      }
      return false;
    } catch (error) {
      logger.error("❌ Send to user failed", {
        error: error.message,
        userId,
        event,
      });
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(event, data) {
    try {
      this.io.emit(event, data);
      return true;
    } catch (error) {
      logger.error("❌ Broadcast failed", {
        error: error.message,
        event,
      });
      return false;
    }
  }

  /**
   * Send message to specific room
   */
  sendToRoom(room, event, data) {
    try {
      this.io.to(room).emit(event, data);
      return true;
    } catch (error) {
      logger.error("❌ Send to room failed", {
        error: error.message,
        room,
        event,
      });
      return false;
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get server status
   */
  getServerStatus() {
    return {
      connectedClients: this.getConnectedClientsCount(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all connected clients
   */
  async getConnectedClients() {
    try {
      const sockets = await this.io.fetchSockets();
      return sockets.map((socket) => ({
        socketId: socket.id,
        userId: socket.userId,
        connectedAt: socket.handshake.time,
      }));
    } catch (error) {
      logger.error("❌ Get connected clients failed", {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Disconnect user
   */
  async disconnectUser(userId) {
    try {
      const socketId = this.connectedClients.get(userId.toString());
      if (socketId) {
        const socket = await this.io.fetchSockets();
        const userSocket = socket.find((s) => s.id === socketId);
        if (userSocket) {
          userSocket.disconnect(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error("❌ User disconnect failed", {
        error: error.message,
        userId,
      });
      return false;
    }
  }
}

// Create singleton instance
const webSocketServer = new WebSocketServer();

module.exports = webSocketServer;
