const authService = require("../services/auth.service");
const logger = require("../utils/logger.util");

/**
 * Authentication controller for user management
 * Handles login, register, token refresh, and security
 */
const authController = {
  /**
   * User registration
   */
  async register(req, res) {
    try {
      const { email, password, name, ...otherData } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: "Email, mật khẩu và tên là bắt buộc",
          errors: {
            email: !email ? "Email là bắt buộc" : null,
            password: !password ? "Mật khẩu là bắt buộc" : null,
            name: !name ? "Tên là bắt buộc" : null,
          },
        });
      }

      // Register user
      const result = await authService.registerUser({
        email,
        password,
        name,
        ...otherData,
      });

      logger.info("✅ User registered successfully", {
        userId: result.user._id,
        email: result.user.email,
      });

      res.status(201).json({
        success: true,
        message: "Đăng ký thành công! Chào mừng bạn đến với BreakFit",
        data: {
          user: {
            _id: result.user._id,
            email: result.user.email,
            name: result.user.name,
            isActive: result.user.isActive,
            createdAt: result.user.createdAt,
          },
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
          },
          profile: result.profile,
        },
      });
    } catch (error) {
      logger.error("❌ User registration failed", {
        error: error.message,
        email: req.body.email,
      });

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Email đã tồn tại trong hệ thống",
        });
      }

      res.status(500).json({
        success: false,
        message: "Đăng ký thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * User login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email và mật khẩu là bắt buộc",
          errors: {
            email: !email ? "Email là bắt buộc" : null,
            password: !password ? "Mật khẩu là bắt buộc" : null,
          },
        });
      }

      // Authenticate user
      const result = await authService.authenticateUser(email, password);

      logger.info("✅ User logged in successfully", {
        userId: result.user._id,
        email: result.user.email,
      });

      res.json({
        success: true,
        message: "Đăng nhập thành công! Chào mừng bạn trở lại",
        data: {
          user: {
            _id: result.user._id,
            email: result.user.email,
            name: result.user.name,
            isActive: result.user.isActive,
            lastLoginAt: result.user.lastLoginAt,
          },
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
          },
          profile: result.profile,
        },
      });
    } catch (error) {
      logger.error("❌ User login failed", {
        error: error.message,
        email: req.body.email,
      });

      if (error.message === "Invalid credentials") {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
        });
      }

      if (error.message === "Account locked") {
        return res.status(423).json({
          success: false,
          message: "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ",
        });
      }

      res.status(500).json({
        success: false,
        message: "Đăng nhập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token là bắt buộc",
        });
      }

      // Refresh token
      const result = await authService.refreshAccessToken(refreshToken);

      logger.info("✅ Token refreshed successfully", {
        userId: result.userId,
      });

      res.json({
        success: true,
        message: "Token đã được làm mới",
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      logger.error("❌ Token refresh failed", {
        error: error.message,
      });

      if (error.message === "Invalid refresh token") {
        return res.status(401).json({
          success: false,
          message: "Refresh token không hợp lệ",
        });
      }

      if (error.message === "Token expired") {
        return res.status(401).json({
          success: false,
          message: "Refresh token đã hết hạn. Vui lòng đăng nhập lại",
        });
      }

      res.status(500).json({
        success: false,
        message: "Làm mới token thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * User logout
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user._id;

      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      logger.info("✅ User logged out successfully", { userId });

      res.json({
        success: true,
        message: "Đăng xuất thành công",
      });
    } catch (error) {
      logger.error("❌ User logout failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Đăng xuất thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc",
          errors: {
            currentPassword: !currentPassword
              ? "Mật khẩu hiện tại là bắt buộc"
              : null,
            newPassword: !newPassword ? "Mật khẩu mới là bắt buộc" : null,
          },
        });
      }

      // Change password
      await authService.changePassword(userId, currentPassword, newPassword);

      logger.info("✅ Password changed successfully", { userId });

      res.json({
        success: true,
        message: "Mật khẩu đã được thay đổi thành công",
      });
    } catch (error) {
      logger.error("❌ Password change failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "Current password is incorrect") {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại không chính xác",
        });
      }

      res.status(500).json({
        success: false,
        message: "Thay đổi mật khẩu thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email là bắt buộc",
        });
      }

      // Request password reset
      await authService.requestPasswordReset(email);

      logger.info("✅ Password reset requested", { email });

      res.json({
        success: true,
        message:
          "Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email",
      });
    } catch (error) {
      logger.error("❌ Password reset request failed", {
        error: error.message,
        email: req.body.email,
      });

      // Don't reveal if user exists or not
      res.json({
        success: true,
        message:
          "Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email",
      });
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token và mật khẩu mới là bắt buộc",
          errors: {
            token: !token ? "Token là bắt buộc" : null,
            newPassword: !newPassword ? "Mật khẩu mới là bắt buộc" : null,
          },
        });
      }

      // Reset password
      await authService.resetPassword(token, newPassword);

      logger.info("✅ Password reset successfully");

      res.json({
        success: true,
        message:
          "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới",
      });
    } catch (error) {
      logger.error("❌ Password reset failed", {
        error: error.message,
      });

      if (error.message === "Invalid or expired token") {
        return res.status(400).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }

      res.status(500).json({
        success: false,
        message: "Đặt lại mật khẩu thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get current user info
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user._id;

      // Get user info
      const user = await authService.getUserById(userId);

      logger.info("✅ Current user info retrieved", { userId });

      res.json({
        success: true,
        message: "Thông tin người dùng đã được lấy thành công",
        data: {
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error("❌ Get current user failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thông tin người dùng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = authController;
