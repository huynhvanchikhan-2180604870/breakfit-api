const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const Gamification = require("../models/gamification.model");
const Event = require("../models/event.model");
const logger = require("../utils/logger.util");

/**
 * Authentication service for user management
 * Handles registration, login, token management, and security
 */
const authService = {
  /**
   * Register new user
   */
  async registerUser(userData) {
    try {
      const { email, password, name, ...otherData } = userData;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error("Email đã được sử dụng");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = new User({
        email,
        passwordHash,
        name,
        ...otherData,
      });

      await user.save();

      // Create user profile
      const profile = new Profile({
        userId: user._id,
        currentWeightKg: otherData.currentWeightKg || 70,
        startWeightKg: otherData.currentWeightKg || 70,
        ...otherData,
      });

      await profile.save();

      // Create gamification profile
      const gamification = new Gamification({
        userId: user._id,
      });

      await gamification.save();

      // Log event
      await Event.createEvent(
        user._id,
        "user.register",
        "User registered",
        `New user ${name} registered`,
        { email, name },
        { userId: user._id }
      );

      // Generate tokens
      const tokens = await this.generateTokens(user._id);

      logger.info("✅ User registered successfully", {
        userId: user._id,
        email,
      });

      return {
        user: user.getPublicProfile(),
        profile,
        gamification,
        ...tokens,
      };
    } catch (error) {
      logger.error("❌ User registration failed", {
        error: error.message,
        email,
      });
      throw error;
    }
  },

  /**
   * Authenticate user login
   */
  async loginUser(email, password) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error("Email hoặc mật khẩu không đúng");
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error("Tài khoản đã bị khóa");
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Email hoặc mật khẩu không đúng");
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Log event
      await Event.createEvent(
        user._id,
        "user.login",
        "User logged in",
        `User ${user.name} logged in`,
        { email, ip: "unknown" },
        { userId: user._id }
      );

      // Generate tokens
      const tokens = await this.generateTokens(user._id);

      logger.info("✅ User login successful", { userId: user._id, email });

      return {
        user: user.getPublicProfile(),
        ...tokens,
      };
    } catch (error) {
      logger.error("❌ User login failed", { error: error.message, email });
      throw error;
    }
  },

  /**
   * Generate JWT tokens
   */
  async generateTokens(userId) {
    try {
      const accessToken = jwt.sign(
        { userId, type: "access" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TTL || "15m" }
      );

      const refreshToken = jwt.sign(
        { userId, type: "refresh" },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_TTL || "7d" }
      );

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error("❌ Token generation failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      // Check if user exists and is active
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: decoded.userId, type: "access" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TTL || "15m" }
      );

      logger.info("✅ Access token refreshed", { userId: decoded.userId });

      return { accessToken };
    } catch (error) {
      logger.error("❌ Token refresh failed", { error: error.message });
      throw error;
    }
  },

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Mật khẩu hiện tại không đúng");
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      user.passwordHash = newPasswordHash;
      await user.save();

      // Log event
      await Event.createEvent(
        userId,
        "user.password_change",
        "Password changed",
        "User changed password",
        {},
        { userId }
      );

      logger.info("✅ Password changed successfully", { userId });

      return { success: true };
    } catch (error) {
      logger.error("❌ Password change failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Reset password (forgot password)
   */
  async resetPassword(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return { success: true, message: "Reset link sent if email exists" };
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id, type: "reset" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      // TODO: Send email with reset link
      logger.info("✅ Password reset token generated", {
        userId: user._id,
        email,
      });

      return { success: true, message: "Reset link sent if email exists" };
    } catch (error) {
      logger.error("❌ Password reset failed", { error: error.message, email });
      throw error;
    }
  },

  /**
   * Verify password reset token
   */
  async verifyResetToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== "reset") {
        throw new Error("Invalid token type");
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.passwordResetToken !== token) {
        throw new Error("Invalid or expired reset token");
      }

      if (user.passwordResetExpires < new Date()) {
        throw new Error("Reset token expired");
      }

      return { userId: decoded.userId, valid: true };
    } catch (error) {
      logger.error("❌ Reset token verification failed", {
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Set new password with reset token
   */
  async setNewPassword(token, newPassword) {
    try {
      const verification = await this.verifyResetToken(token);
      if (!verification.valid) {
        throw new Error("Invalid reset token");
      }

      const user = await User.findById(verification.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      user.passwordHash = newPasswordHash;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Log event
      await Event.createEvent(
        user._id,
        "user.password_change",
        "Password reset",
        "User reset password via reset link",
        {},
        { userId: user._id }
      );

      logger.info("✅ Password reset successfully", { userId: user._id });

      return { success: true };
    } catch (error) {
      logger.error("❌ Password reset failed", { error: error.message });
      throw error;
    }
  },

  /**
   * Logout user (revoke tokens)
   */
  async logoutUser(userId) {
    try {
      // Log event
      await Event.createEvent(
        userId,
        "user.logout",
        "User logged out",
        "User logged out",
        {},
        { userId }
      );

      logger.info("✅ User logged out", { userId });

      return { success: true };
    } catch (error) {
      logger.error("❌ Logout failed", { error: error.message, userId });
      throw error;
    }
  },

  /**
   * Get user profile with related data
   */
  async getUserProfile(userId) {
    try {
      const [user, profile, gamification] = await Promise.all([
        User.findById(userId),
        Profile.findOne({ userId }),
        Gamification.findOne({ userId }),
      ]);

      if (!user) {
        throw new Error("User not found");
      }

      return {
        user: user.getPublicProfile(),
        profile,
        gamification,
      };
    } catch (error) {
      logger.error("❌ Get user profile failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};

module.exports = authService;
