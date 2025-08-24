const planService = require("../services/plan.service");
const logger = require("../utils/logger.util");

/**
 * Plan controller for 30-day weight loss plans
 * Handles plan creation, progress tracking, and completion
 */
const planController = {
  /**
   * Create new 30-day plan
   */
  async createPlan(req, res) {
    try {
      const userId = req.user._id;
      const {
        name,
        targetWeight,
        startDate,
        goalType,
        activityLevel,
        preferences,
      } = req.body;

      // Validate required fields
      if (!name || !targetWeight || !startDate || !goalType) {
        return res.status(400).json({
          success: false,
          message:
            "Tên, cân nặng mục tiêu, ngày bắt đầu và loại mục tiêu là bắt buộc",
          errors: {
            name: !name ? "Tên kế hoạch là bắt buộc" : null,
            targetWeight: !targetWeight
              ? "Cân nặng mục tiêu là bắt buộc"
              : null,
            startDate: !startDate ? "Ngày bắt đầu là bắt buộc" : null,
            goalType: !goalType ? "Loại mục tiêu là bắt buộc" : null,
          },
        });
      }

      // Validate goal type
      const validGoalTypes = ["weight_loss", "muscle_gain", "maintenance"];
      if (!validGoalTypes.includes(goalType)) {
        return res.status(400).json({
          success: false,
          message: "Loại mục tiêu không hợp lệ",
        });
      }

      // Create plan
      const plan = await planService.create30DayPlan(userId, {
        name,
        targetWeight,
        startDate,
        goalType,
        activityLevel,
        preferences,
      });

      logger.info("✅ 30-day plan created", {
        userId,
        planId: plan._id,
        name,
        goalType,
      });

      res.status(201).json({
        success: true,
        message: "Kế hoạch 30 ngày đã được tạo thành công",
        data: { plan },
      });
    } catch (error) {
      logger.error("❌ Create plan failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "Active plan already exists") {
        return res.status(409).json({
          success: false,
          message:
            "Bạn đã có kế hoạch đang hoạt động. Vui lòng hoàn thành hoặc hủy bỏ kế hoạch hiện tại",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo kế hoạch thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get current plan
   */
  async getCurrentPlan(req, res) {
    try {
      const userId = req.user._id;

      // Get current plan
      const plan = await planService.getCurrentPlan(userId);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kế hoạch đang hoạt động",
        });
      }

      logger.info("✅ Current plan retrieved", {
        userId,
        planId: plan._id,
      });

      res.json({
        success: true,
        message: "Kế hoạch hiện tại đã được lấy thành công",
        data: { plan },
      });
    } catch (error) {
      logger.error("❌ Get current plan failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy kế hoạch hiện tại thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update plan progress
   */
  async updateProgress(req, res) {
    try {
      const userId = req.user._id;
      const { planId } = req.params;
      const { dayNumber, completed, notes } = req.body;

      // Validate required fields
      if (!dayNumber || completed === undefined) {
        return res.status(400).json({
          success: false,
          message: "Số ngày và trạng thái hoàn thành là bắt buộc",
          errors: {
            dayNumber: !dayNumber ? "Số ngày là bắt buộc" : null,
            completed:
              completed === undefined
                ? "Trạng thái hoàn thành là bắt buộc"
                : null,
          },
        });
      }

      // Update progress
      const progress = await planService.updateDayProgress(
        planId,
        userId,
        dayNumber,
        {
          completed,
          notes,
        }
      );

      logger.info("✅ Plan progress updated", {
        userId,
        planId,
        dayNumber,
        completed,
      });

      res.json({
        success: true,
        message: "Tiến độ kế hoạch đã được cập nhật thành công",
        data: { progress },
      });
    } catch (error) {
      logger.error("❌ Update plan progress failed", {
        error: error.message,
        userId: req.user?._id,
        planId: req.params.planId,
      });

      if (error.message === "Plan not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kế hoạch",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa kế hoạch này",
        });
      }

      if (error.message === "Invalid day number") {
        return res.status(400).json({
          success: false,
          message: "Số ngày không hợp lệ",
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
   * Get plan statistics
   */
  async getPlanStats(req, res) {
    try {
      const userId = req.user._id;
      const { planId } = req.params;

      // Get plan statistics
      const stats = await planService.getPlanStatistics(planId, userId);

      logger.info("✅ Plan statistics retrieved", {
        userId,
        planId,
      });

      res.json({
        success: true,
        message: "Thống kê kế hoạch đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get plan statistics failed", {
        error: error.message,
        userId: req.user?._id,
        planId: req.params.planId,
      });

      if (error.message === "Plan not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kế hoạch",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem kế hoạch này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy thống kê kế hoạch thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Complete plan
   */
  async completePlan(req, res) {
    try {
      const userId = req.user._id;
      const { planId } = req.params;
      const { finalWeight, notes, rating } = req.body;

      // Complete plan
      const result = await planService.completePlan(planId, userId, {
        finalWeight,
        notes,
        rating,
      });

      logger.info("✅ Plan completed", {
        userId,
        planId,
        finalWeight,
        rating,
      });

      res.json({
        success: true,
        message: "Chúc mừng! Bạn đã hoàn thành kế hoạch 30 ngày",
        data: { result },
      });
    } catch (error) {
      logger.error("❌ Complete plan failed", {
        error: error.message,
        userId: req.user?._id,
        planId: req.params.planId,
      });

      if (error.message === "Plan not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy kế hoạch",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền hoàn thành kế hoạch này",
        });
      }

      if (error.message === "Plan already completed") {
        return res.status(400).json({
          success: false,
          message: "Kế hoạch đã được hoàn thành",
        });
      }

      res.status(500).json({
        success: false,
        message: "Hoàn thành kế hoạch thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get plan history
   */
  async getPlanHistory(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 10, page = 1 } = req.query;

      // Get plan history
      const result = await planService.getPlanHistory(userId, {
        limit: parseInt(limit),
        page: parseInt(page),
      });

      logger.info("✅ Plan history retrieved", {
        userId,
        count: result.plans.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Lịch sử kế hoạch đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get plan history failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy lịch sử kế hoạch thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = planController;
