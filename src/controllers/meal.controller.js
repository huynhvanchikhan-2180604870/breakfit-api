const mealService = require("../services/meal.service");
const logger = require("../utils/logger.util");

/**
 * Meal controller for meal tracking
 * Handles meal entries, nutrition, and photos
 */
const mealController = {
  /**
   * Add meal entry
   */
  async addMeal(req, res) {
    try {
      const userId = req.user._id;
      const {
        mealType,
        name,
        calories,
        protein,
        carb,
        fat,
        dateISO,
        timeISO,
        notes,
        photoId,
      } = req.body;

      // Validate required fields
      if (!mealType || !name || !calories || !dateISO) {
        return res.status(400).json({
          success: false,
          message: "Loại bữa ăn, tên, calo và ngày là bắt buộc",
          errors: {
            mealType: !mealType ? "Loại bữa ăn là bắt buộc" : null,
            name: !name ? "Tên bữa ăn là bắt buộc" : null,
            calories: !calories ? "Calo là bắt buộc" : null,
            dateISO: !dateISO ? "Ngày là bắt buộc" : null,
          },
        });
      }

      // Validate meal type
      const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
      if (!validMealTypes.includes(mealType)) {
        return res.status(400).json({
          success: false,
          message: "Loại bữa ăn không hợp lệ",
        });
      }

      // Validate calories range
      if (calories < 0 || calories > 5000) {
        return res.status(400).json({
          success: false,
          message: "Calo phải từ 0 đến 5000",
        });
      }

      // Add meal entry
      const meal = await mealService.addMealEntry(userId, {
        mealType,
        name,
        calories,
        protein,
        carb,
        fat,
        dateISO,
        timeISO,
        notes,
        photoId,
      });

      logger.info("✅ Meal entry added", {
        userId,
        mealId: meal._id,
        mealType,
        name,
        calories,
        dateISO,
      });

      res.status(201).json({
        success: true,
        message: "Bữa ăn đã được ghi nhận thành công",
        data: { meal },
      });
    } catch (error) {
      logger.error("❌ Add meal entry failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Ghi nhận bữa ăn thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get meal entries
   */
  async getMealEntries(req, res) {
    try {
      const userId = req.user._id;
      const { startDate, endDate, mealType, limit = 30, page = 1 } = req.query;

      // Get meal entries
      const result = await mealService.getMealEntries(userId, {
        startDate,
        endDate,
        mealType,
        limit: parseInt(limit),
        page: parseInt(page),
      });

      logger.info("✅ Meal entries retrieved", {
        userId,
        count: result.entries.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách bữa ăn đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get meal entries failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách bữa ăn thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update meal entry
   */
  async updateMeal(req, res) {
    try {
      const userId = req.user._id;
      const { mealId } = req.params;
      const updates = req.body;

      // Validate required fields
      if (!updates.name || !updates.calories) {
        return res.status(400).json({
          success: false,
          message: "Tên và calo là bắt buộc",
        });
      }

      // Validate calories range
      if (updates.calories < 0 || updates.calories > 5000) {
        return res.status(400).json({
          success: false,
          message: "Calo phải từ 0 đến 5000",
        });
      }

      // Update meal entry
      const meal = await mealService.updateMealEntry(mealId, userId, updates);

      logger.info("✅ Meal entry updated", {
        userId,
        mealId,
        name: updates.name,
        calories: updates.calories,
      });

      res.json({
        success: true,
        message: "Bữa ăn đã được cập nhật thành công",
        data: { meal },
      });
    } catch (error) {
      logger.error("❌ Update meal entry failed", {
        error: error.message,
        userId: req.user?._id,
        mealId: req.params.mealId,
      });

      if (error.message === "Meal entry not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bữa ăn",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa bữa ăn này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật bữa ăn thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Delete meal entry
   */
  async deleteMeal(req, res) {
    try {
      const userId = req.user._id;
      const { mealId } = req.params;

      // Delete meal entry
      await mealService.deleteMealEntry(mealId, userId);

      logger.info("✅ Meal entry deleted", {
        userId,
        mealId,
      });

      res.json({
        success: true,
        message: "Bữa ăn đã được xóa thành công",
      });
    } catch (error) {
      logger.error("❌ Delete meal entry failed", {
        error: error.message,
        userId: req.user?._id,
        mealId: req.params.mealId,
      });

      if (error.message === "Meal entry not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bữa ăn",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa bữa ăn này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Xóa bữa ăn thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get nutrition summary
   */
  async getNutritionSummary(req, res) {
    try {
      const userId = req.user._id;
      const { dateISO } = req.query;

      if (!dateISO) {
        return res.status(400).json({
          success: false,
          message: "Ngày là bắt buộc",
        });
      }

      // Get nutrition summary
      const summary = await mealService.getNutritionSummary(userId, dateISO);

      logger.info("✅ Nutrition summary retrieved", {
        userId,
        dateISO,
      });

      res.json({
        success: true,
        message: "Tóm tắt dinh dưỡng đã được lấy thành công",
        data: { summary },
      });
    } catch (error) {
      logger.error("❌ Get nutrition summary failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy tóm tắt dinh dưỡng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get meal statistics
   */
  async getMealStats(req, res) {
    try {
      const userId = req.user._id;
      const { days = 30 } = req.query;

      // Get meal statistics
      const stats = await mealService.getMealStatistics(userId, parseInt(days));

      logger.info("✅ Meal statistics retrieved", {
        userId,
        days,
      });

      res.json({
        success: true,
        message: "Thống kê bữa ăn đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get meal statistics failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thống kê bữa ăn thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = mealController;
