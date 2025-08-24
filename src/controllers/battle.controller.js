const battleService = require("../services/battle.service");
const logger = require("../utils/logger.util");

/**
 * Battle controller for managing 1-1 battles
 * Handles battle CRUD operations and participation
 */
const battleController = {
  /**
   * Create a new battle
   */
  async createBattle(req, res) {
    try {
      const userId = req.user._id;
      const battleData = req.body;

      // Validate required fields
      if (
        !battleData.title ||
        !battleData.battleType ||
        !battleData.durationDays
      ) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề, loại trận đấu và thời gian là bắt buộc",
        });
      }

      // Create battle
      const battle = await battleService.createBattle(battleData, userId);

      logger.info("✅ Battle created successfully", {
        userId,
        battleId: battle._id,
        title: battle.title,
      });

      res.status(201).json({
        success: true,
        message: "Trận đấu đã được tạo thành công",
        data: { battle },
      });
    } catch (error) {
      logger.error("❌ Create battle failed", {
        error: error.message,
        userId: req.user?._id,
        battleData: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Tạo trận đấu thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get battles with filtering
   */
  async getBattles(req, res) {
    try {
      const {
        status,
        battleType,
        limit = 20,
        page = 1,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const options = {
        status,
        battleType,
        limit: parseInt(limit),
        page: parseInt(page),
        sortBy,
        sortOrder,
      };

      const result = await battleService.getBattles(options);

      logger.info("✅ Battles retrieved successfully", {
        userId: req.user?._id,
        count: result.battles.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách trận đấu đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get battles failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách trận đấu thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get battle by ID
   */
  async getBattle(req, res) {
    try {
      const userId = req.user._id;
      const { battleId } = req.params;

      if (!battleId) {
        return res.status(400).json({
          success: false,
          message: "Battle ID là bắt buộc",
        });
      }

      const battle = await battleService.getBattleById(battleId, userId);

      logger.info("✅ Battle retrieved successfully", {
        userId,
        battleId,
      });

      res.json({
        success: true,
        message: "Thông tin trận đấu đã được lấy thành công",
        data: { battle },
      });
    } catch (error) {
      logger.error("❌ Get battle failed", {
        error: error.message,
        userId: req.user?._id,
        battleId: req.params.battleId,
      });

      if (error.message === "Battle not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy trận đấu",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy thông tin trận đấu thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Accept a battle
   */
  async acceptBattle(req, res) {
    try {
      const userId = req.user._id;
      const { battleId } = req.params;

      if (!battleId) {
        return res.status(400).json({
          success: false,
          message: "Battle ID là bắt buộc",
        });
      }

      const battle = await battleService.acceptBattle(battleId, userId);

      logger.info("✅ Battle accepted successfully", {
        userId,
        battleId,
      });

      res.json({
        success: true,
        message: "Đã chấp nhận trận đấu thành công",
        data: { battle },
      });
    } catch (error) {
      logger.error("❌ Accept battle failed", {
        error: error.message,
        userId: req.user?._id,
        battleId: req.params.battleId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("cannot accept")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Chấp nhận trận đấu thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Set battle baseline
   */
  async setBaseline(req, res) {
    try {
      const userId = req.user._id;
      const { battleId } = req.params;
      const { baselineValue } = req.body;

      if (!battleId || baselineValue === undefined) {
        return res.status(400).json({
          success: false,
          message: "Battle ID và giá trị baseline là bắt buộc",
        });
      }

      const battle = await battleService.setBaseline(
        battleId,
        userId,
        baselineValue
      );

      logger.info("✅ Battle baseline set successfully", {
        userId,
        battleId,
        baselineValue,
      });

      res.json({
        success: true,
        message: "Baseline đã được thiết lập thành công",
        data: { battle },
      });
    } catch (error) {
      logger.error("❌ Set battle baseline failed", {
        error: error.message,
        userId: req.user?._id,
        battleId: req.params.battleId,
        baselineValue: req.body.baselineValue,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Thiết lập baseline thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update battle progress
   */
  async updateProgress(req, res) {
    try {
      const userId = req.user._id;
      const { battleId } = req.params;
      const { currentValue, note = "" } = req.body;

      if (!battleId || currentValue === undefined) {
        return res.status(400).json({
          success: false,
          message: "Battle ID và giá trị hiện tại là bắt buộc",
        });
      }

      const battle = await battleService.updateProgress(
        battleId,
        userId,
        currentValue,
        note
      );

      logger.info("✅ Battle progress updated successfully", {
        userId,
        battleId,
        currentValue,
        note,
      });

      res.json({
        success: true,
        message: "Tiến độ trận đấu đã được cập nhật thành công",
        data: { battle },
      });
    } catch (error) {
      logger.error("❌ Update battle progress failed", {
        error: error.message,
        userId: req.user?._id,
        battleId: req.params.battleId,
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

  /**
   * Add battle update
   */
  async addUpdate(req, res) {
    try {
      const userId = req.user._id;
      const { battleId } = req.params;
      const { type, message } = req.body;

      if (!battleId || !type || !message) {
        return res.status(400).json({
          success: false,
          message: "Battle ID, loại và nội dung cập nhật là bắt buộc",
        });
      }

      const battle = await battleService.addUpdate(
        battleId,
        userId,
        type,
        message
      );

      logger.info("✅ Battle update added successfully", {
        userId,
        battleId,
        type,
        message,
      });

      res.json({
        success: true,
        message: "Cập nhật trận đấu đã được thêm thành công",
        data: { battle },
      });
    } catch (error) {
      logger.error("❌ Add battle update failed", {
        error: error.message,
        userId: req.user?._id,
        battleId: req.params.battleId,
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
        message: "Thêm cập nhật thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user's battles
   */
  async getUserBattles(req, res) {
    try {
      const userId = req.user._id;
      const { status, limit = 20, page = 1 } = req.query;

      const options = {
        status,
        limit: parseInt(limit),
        page: parseInt(page),
      };

      const result = await battleService.getUserBattles(userId, options);

      logger.info("✅ User battles retrieved successfully", {
        userId,
        count: result.battles.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách trận đấu của bạn đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get user battles failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách trận đấu thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get battle statistics
   */
  async getBattleStats(req, res) {
    try {
      const userId = req.user._id;

      const stats = await battleService.getBattleStats(userId);

      logger.info("✅ Battle stats retrieved successfully", {
        userId,
      });

      res.json({
        success: true,
        message: "Thống kê trận đấu đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get battle stats failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thống kê trận đấu thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = battleController;
