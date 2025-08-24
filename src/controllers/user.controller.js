const userService = require("../services/user.service");
const logger = require("../utils/logger.util");

/**
 * User controller for profile management
 * Handles user profiles, settings, and preferences
 */
const userController = {
  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user._id;

      // Get user profile
      const profile = await userService.getUserProfile(userId);

      logger.info("✅ User profile retrieved", { userId });

      res.json({
        success: true,
        message: "Hồ sơ người dùng đã được lấy thành công",
        data: { profile },
      });
    } catch (error) {
      logger.error("❌ Get user profile failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "Profile not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hồ sơ người dùng",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy hồ sơ người dùng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const updates = req.body;

      // Validate required fields
      if (!updates.name) {
        return res.status(400).json({
          success: false,
          message: "Tên là bắt buộc",
        });
      }

      // Update profile
      const profile = await userService.updateUserProfile(userId, updates);

      logger.info("✅ User profile updated", { userId });

      res.json({
        success: true,
        message: "Hồ sơ đã được cập nhật thành công",
        data: { profile },
      });
    } catch (error) {
      logger.error("❌ Update user profile failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "Profile not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hồ sơ người dùng",
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật hồ sơ thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user._id;
      const { days = 30 } = req.query;

      // Get user statistics
      const stats = await userService.getUserStatistics(userId, parseInt(days));

      logger.info("✅ User statistics retrieved", { userId, days });

      res.json({
        success: true,
        message: "Thống kê người dùng đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get user statistics failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thống kê người dùng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update user preferences
   */
  async updatePreferences(req, res) {
    try {
      const userId = req.user._id;
      const preferences = req.body;

      // Update preferences
      const result = await userService.updateUserPreferences(
        userId,
        preferences
      );

      logger.info("✅ User preferences updated", { userId });

      res.json({
        success: true,
        message: "Tùy chọn đã được cập nhật thành công",
        data: { preferences: result },
      });
    } catch (error) {
      logger.error("❌ Update user preferences failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Cập nhật tùy chọn thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user._id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu là bắt buộc để xác nhận xóa tài khoản",
        });
      }

      // Delete account
      await userService.deleteUserAccount(userId, password);

      logger.info("✅ User account deleted", { userId });

      res.json({
        success: true,
        message: "Tài khoản đã được xóa thành công",
      });
    } catch (error) {
      logger.error("❌ Delete user account failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "Invalid password") {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu không chính xác",
        });
      }

      res.status(500).json({
        success: false,
        message: "Xóa tài khoản thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = userController;
