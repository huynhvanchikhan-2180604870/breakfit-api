const challengeService = require("../services/challenge.service");
const logger = require("../utils/logger.util");

/**
 * Challenge controller for managing fitness challenges
 * Handles challenge CRUD operations and participation
 */
const challengeController = {
  /**
   * Create a new challenge
   */
  async createChallenge(req, res) {
    try {
      const userId = req.user._id;
      const challengeData = req.body;

      // Validate required fields
      if (!challengeData.title || !challengeData.durationDays) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề và thời gian thử thách là bắt buộc",
        });
      }

      // Create challenge
      const challenge = await challengeService.createChallenge(
        challengeData,
        userId
      );

      logger.info("✅ Challenge created successfully", {
        userId,
        challengeId: challenge._id,
        title: challenge.title,
      });

      res.status(201).json({
        success: true,
        message: "Thử thách đã được tạo thành công",
        data: { challenge },
      });
    } catch (error) {
      logger.error("❌ Create challenge failed", {
        error: error.message,
        userId: req.user?._id,
        challengeData: req.body,
      });

      if (error.message.includes("Start date must be")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo thử thách thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get challenges with filtering
   */
  async getChallenges(req, res) {
    try {
      const {
        status,
        category,
        isPublic,
        isFeatured,
        limit = 20,
        page = 1,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const options = {
        status,
        category,
        isPublic: isPublic === "true",
        isFeatured: isFeatured === "true",
        limit: parseInt(limit),
        page: parseInt(page),
        sortBy,
        sortOrder,
      };

      const result = await challengeService.getChallenges(options);

      logger.info("✅ Challenges retrieved successfully", {
        userId: req.user?._id,
        count: result.challenges.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách thử thách đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get challenges failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách thử thách thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get challenge by ID
   */
  async getChallenge(req, res) {
    try {
      const userId = req.user._id;
      const { challengeId } = req.params;

      if (!challengeId) {
        return res.status(400).json({
          success: false,
          message: "Challenge ID là bắt buộc",
        });
      }

      const challenge = await challengeService.getChallengeById(
        challengeId,
        userId
      );

      logger.info("✅ Challenge retrieved successfully", {
        userId,
        challengeId,
      });

      res.json({
        success: true,
        message: "Thông tin thử thách đã được lấy thành công",
        data: { challenge },
      });
    } catch (error) {
      logger.error("❌ Get challenge failed", {
        error: error.message,
        userId: req.user?._id,
        challengeId: req.params.challengeId,
      });

      if (error.message === "Challenge not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thử thách",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy thông tin thử thách thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Join a challenge
   */
  async joinChallenge(req, res) {
    try {
      const userId = req.user._id;
      const { challengeId } = req.params;

      if (!challengeId) {
        return res.status(400).json({
          success: false,
          message: "Challenge ID là bắt buộc",
        });
      }

      const challenge = await challengeService.joinChallenge(
        challengeId,
        userId
      );

      logger.info("✅ User joined challenge successfully", {
        userId,
        challengeId,
      });

      res.json({
        success: true,
        message: "Đã tham gia thử thách thành công",
        data: { challenge },
      });
    } catch (error) {
      logger.error("❌ Join challenge failed", {
        error: error.message,
        userId: req.user?._id,
        challengeId: req.params.challengeId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("already a participant")) {
        return res.status(400).json({
          success: false,
          message: "Bạn đã tham gia thử thách này rồi",
        });
      }

      if (error.message.includes("Challenge is full")) {
        return res.status(400).json({
          success: false,
          message: "Thử thách đã đầy người tham gia",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tham gia thử thách thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Leave a challenge
   */
  async leaveChallenge(req, res) {
    try {
      const userId = req.user._id;
      const { challengeId } = req.params;

      if (!challengeId) {
        return res.status(400).json({
          success: false,
          message: "Challenge ID là bắt buộc",
        });
      }

      const challenge = await challengeService.leaveChallenge(
        challengeId,
        userId
      );

      logger.info("✅ User left challenge successfully", {
        userId,
        challengeId,
      });

      res.json({
        success: true,
        message: "Đã rời khỏi thử thách thành công",
        data: { challenge },
      });
    } catch (error) {
      logger.error("❌ Leave challenge failed", {
        error: error.message,
        userId: req.user?._id,
        challengeId: req.params.challengeId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Rời khỏi thử thách thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get challenge leaderboard
   */
  async getLeaderboard(req, res) {
    try {
      const { challengeId } = req.params;
      const { limit = 50, metric = "completion" } = req.query;

      if (!challengeId) {
        return res.status(400).json({
          success: false,
          message: "Challenge ID là bắt buộc",
        });
      }

      const leaderboard = await challengeService.getLeaderboard(challengeId, {
        limit: parseInt(limit),
        metric,
      });

      logger.info("✅ Challenge leaderboard retrieved successfully", {
        userId: req.user?._id,
        challengeId,
        leaderboardSize: leaderboard.length,
      });

      res.json({
        success: true,
        message: "Bảng xếp hạng thử thách đã được lấy thành công",
        data: { leaderboard },
      });
    } catch (error) {
      logger.error("❌ Get challenge leaderboard failed", {
        error: error.message,
        userId: req.user?._id,
        challengeId: req.params.challengeId,
        query: req.query,
      });

      if (error.message === "Challenge not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thử thách",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy bảng xếp hạng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user's challenges
   */
  async getUserChallenges(req, res) {
    try {
      const userId = req.user._id;
      const { status, limit = 20, page = 1 } = req.query;

      const options = {
        status,
        limit: parseInt(limit),
        page: parseInt(page),
      };

      const result = await challengeService.getUserChallenges(userId, options);

      logger.info("✅ User challenges retrieved successfully", {
        userId,
        count: result.challenges.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách thử thách của bạn đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get user challenges failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách thử thách thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update challenge progress
   */
  async updateProgress(req, res) {
    try {
      const userId = req.user._id;
      const { challengeId } = req.params;
      const { dayNumber, score, completed = true } = req.body;

      if (!challengeId || dayNumber === undefined || score === undefined) {
        return res.status(400).json({
          success: false,
          message: "Challenge ID, ngày và điểm số là bắt buộc",
        });
      }

      const challenge = await challengeService.updateProgress(
        challengeId,
        userId,
        parseInt(dayNumber),
        parseInt(score),
        completed
      );

      logger.info("✅ Challenge progress updated successfully", {
        userId,
        challengeId,
        dayNumber,
        score,
        completed,
      });

      res.json({
        success: true,
        message: "Tiến độ thử thách đã được cập nhật thành công",
        data: { challenge },
      });
    } catch (error) {
      logger.error("❌ Update challenge progress failed", {
        error: error.message,
        userId: req.user?._id,
        challengeId: req.params.challengeId,
        body: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật tiến độ thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = challengeController;
