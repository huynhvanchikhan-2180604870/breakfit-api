const weightService = require("../services/weight.service");
const logger = require("../utils/logger.util");

/**
 * Weight controller for weight tracking
 * Handles weight entries, trends, and goals
 */
const weightController = {
  /**
   * Add weight entry
   */
  async addWeight(req, res) {
    try {
      const userId = req.user._id;
      const { weightKg, dateISO, notes } = req.body;

      // Validate required fields
      if (!weightKg || !dateISO) {
        return res.status(400).json({
          success: false,
          message: "Cân nặng và ngày là bắt buộc",
          errors: {
            weightKg: !weightKg ? "Cân nặng là bắt buộc" : null,
            dateISO: !dateISO ? "Ngày là bắt buộc" : null,
          },
        });
      }

      // Validate weight range
      if (weightKg < 30 || weightKg > 300) {
        return res.status(400).json({
          success: false,
          message: "Cân nặng phải từ 30kg đến 300kg",
        });
      }

      // Add weight entry
      const weight = await weightService.addWeightEntry(userId, {
        weightKg,
        dateISO,
        notes,
      });

      logger.info("✅ Weight entry added", {
        userId,
        weightId: weight._id,
        weightKg,
        dateISO,
      });

      res.status(201).json({
        success: true,
        message: "Cân nặng đã được ghi nhận thành công",
        data: { weight },
      });
    } catch (error) {
      logger.error("❌ Add weight entry failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "Weight entry already exists for this date") {
        return res.status(409).json({
          success: false,
          message: "Đã có ghi nhận cân nặng cho ngày này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Ghi nhận cân nặng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get weight entries
   */
  async getWeightEntries(req, res) {
    try {
      const userId = req.user._id;
      const { startDate, endDate, limit = 30, page = 1 } = req.query;

      // Get weight entries
      const result = await weightService.getWeightEntries(userId, {
        startDate,
        endDate,
        limit: parseInt(limit),
        page: parseInt(page),
      });

      logger.info("✅ Weight entries retrieved", {
        userId,
        count: result.entries.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách cân nặng đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get weight entries failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách cân nặng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update weight entry
   */
  async updateWeight(req, res) {
    try {
      const userId = req.user._id;
      const { weightId } = req.params;
      const updates = req.body;

      // Validate required fields
      if (!updates.weightKg) {
        return res.status(400).json({
          success: false,
          message: "Cân nặng là bắt buộc",
        });
      }

      // Validate weight range
      if (updates.weightKg < 30 || updates.weightKg > 300) {
        return res.status(400).json({
          success: false,
          message: "Cân nặng phải từ 30kg đến 300kg",
        });
      }

      // Update weight entry
      const weight = await weightService.updateWeightEntry(
        weightId,
        userId,
        updates
      );

      logger.info("✅ Weight entry updated", {
        userId,
        weightId,
        weightKg: updates.weightKg,
      });

      res.json({
        success: true,
        message: "Cân nặng đã được cập nhật thành công",
        data: { weight },
      });
    } catch (error) {
      logger.error("❌ Update weight entry failed", {
        error: error.message,
        userId: req.user?._id,
        weightId: req.params.weightId,
      });

      if (error.message === "Weight entry not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy ghi nhận cân nặng",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa ghi nhận này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật cân nặng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Delete weight entry
   */
  async deleteWeight(req, res) {
    try {
      const userId = req.user._id;
      const { weightId } = req.params;

      // Delete weight entry
      await weightService.deleteWeightEntry(weightId, userId);

      logger.info("✅ Weight entry deleted", {
        userId,
        weightId,
      });

      res.json({
        success: true,
        message: "Ghi nhận cân nặng đã được xóa thành công",
      });
    } catch (error) {
      logger.error("❌ Delete weight entry failed", {
        error: error.message,
        userId: req.user?._id,
        weightId: req.params.weightId,
      });

      if (error.message === "Weight entry not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy ghi nhận cân nặng",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa ghi nhận này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Xóa ghi nhận cân nặng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get weight trends
   */
  async getWeightTrends(req, res) {
    try {
      const userId = req.user._id;
      const { days = 30 } = req.query;

      // Get weight trends
      const trends = await weightService.getWeightTrends(
        userId,
        parseInt(days)
      );

      logger.info("✅ Weight trends retrieved", {
        userId,
        days,
      });

      res.json({
        success: true,
        message: "Xu hướng cân nặng đã được lấy thành công",
        data: { trends },
      });
    } catch (error) {
      logger.error("❌ Get weight trends failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy xu hướng cân nặng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get weight statistics
   */
  async getWeightStats(req, res) {
    try {
      const userId = req.user._id;
      const { days = 30 } = req.query;

      // Get weight statistics
      const stats = await weightService.getWeightStatistics(
        userId,
        parseInt(days)
      );

      logger.info("✅ Weight statistics retrieved", {
        userId,
        days,
      });

      res.json({
        success: true,
        message: "Thống kê cân nặng đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get weight statistics failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thống kê cân nặng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = weightController;
