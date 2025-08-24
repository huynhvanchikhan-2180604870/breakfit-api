const workoutService = require("../services/workout.service");
const logger = require("../utils/logger.util");

/**
 * Workout controller for exercise tracking
 * Handles workout sessions, exercises, and progress
 */
const workoutController = {
  /**
   * Start workout session
   */
  async startWorkout(req, res) {
    try {
      const userId = req.user._id;
      const { workoutType, name, notes, targetDuration } = req.body;

      // Validate required fields
      if (!workoutType || !name) {
        return res.status(400).json({
          success: false,
          message: "Loại workout và tên là bắt buộc",
          errors: {
            workoutType: !workoutType ? "Loại workout là bắt buộc" : null,
            name: !name ? "Tên workout là bắt buộc" : null,
          },
        });
      }

      // Validate workout type
      const validWorkoutTypes = [
        "cardio",
        "strength",
        "flexibility",
        "sports",
        "other",
      ];
      if (!validWorkoutTypes.includes(workoutType)) {
        return res.status(400).json({
          success: false,
          message: "Loại workout không hợp lệ",
        });
      }

      // Start workout
      const workout = await workoutService.startWorkoutSession(userId, {
        workoutType,
        name,
        notes,
        targetDuration,
      });

      logger.info("✅ Workout session started", {
        userId,
        workoutId: workout._id,
        workoutType,
        name,
      });

      res.status(201).json({
        success: true,
        message: "Buổi tập đã được bắt đầu thành công",
        data: { workout },
      });
    } catch (error) {
      logger.error("❌ Start workout failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Bắt đầu buổi tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * End workout session
   */
  async endWorkout(req, res) {
    try {
      const userId = req.user._id;
      const { workoutId } = req.params;
      const { notes, rating } = req.body;

      // End workout
      const workout = await workoutService.endWorkoutSession(
        workoutId,
        userId,
        {
          notes,
          rating,
        }
      );

      logger.info("✅ Workout session ended", {
        userId,
        workoutId,
        duration: workout.duration,
        caloriesBurned: workout.caloriesBurned,
      });

      res.json({
        success: true,
        message: "Buổi tập đã được kết thúc thành công",
        data: { workout },
      });
    } catch (error) {
      logger.error("❌ End workout failed", {
        error: error.message,
        userId: req.user?._id,
        workoutId: req.params.workoutId,
      });

      if (error.message === "Workout not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy buổi tập",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa buổi tập này",
        });
      }

      if (error.message === "Workout already ended") {
        return res.status(400).json({
          success: false,
          message: "Buổi tập đã kết thúc",
        });
      }

      res.status(500).json({
        success: false,
        message: "Kết thúc buổi tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Add exercise to workout
   */
  async addExercise(req, res) {
    try {
      const userId = req.user._id;
      const { workoutId } = req.params;
      const {
        exerciseName,
        sets,
        reps,
        weight,
        duration,
        distance,
        calories,
        notes,
      } = req.body;

      // Validate required fields
      if (!exerciseName) {
        return res.status(400).json({
          success: false,
          message: "Tên bài tập là bắt buộc",
        });
      }

      // Add exercise
      const exercise = await workoutService.addExerciseToWorkout(
        workoutId,
        userId,
        {
          exerciseName,
          sets,
          reps,
          weight,
          duration,
          distance,
          calories,
          notes,
        }
      );

      logger.info("✅ Exercise added to workout", {
        userId,
        workoutId,
        exerciseId: exercise._id,
        exerciseName,
      });

      res.status(201).json({
        success: true,
        message: "Bài tập đã được thêm vào buổi tập thành công",
        data: { exercise },
      });
    } catch (error) {
      logger.error("❌ Add exercise failed", {
        error: error.message,
        userId: req.user?._id,
        workoutId: req.params.workoutId,
      });

      if (error.message === "Workout not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy buổi tập",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa buổi tập này",
        });
      }

      if (error.message === "Workout already ended") {
        return res.status(400).json({
          success: false,
          message: "Không thể thêm bài tập vào buổi tập đã kết thúc",
        });
      }

      res.status(500).json({
        success: false,
        message: "Thêm bài tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get workout entries
   */
  async getWorkoutEntries(req, res) {
    try {
      const userId = req.user._id;
      const {
        startDate,
        endDate,
        workoutType,
        limit = 30,
        page = 1,
      } = req.query;

      // Get workout entries
      const result = await workoutService.getWorkoutEntries(userId, {
        startDate,
        endDate,
        workoutType,
        limit: parseInt(limit),
        page: parseInt(page),
      });

      logger.info("✅ Workout entries retrieved", {
        userId,
        count: result.entries.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách buổi tập đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get workout entries failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách buổi tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get workout by ID
   */
  async getWorkout(req, res) {
    try {
      const userId = req.user._id;
      const { workoutId } = req.params;

      // Get workout
      const workout = await workoutService.getWorkoutById(workoutId, userId);

      logger.info("✅ Workout retrieved", {
        userId,
        workoutId,
      });

      res.json({
        success: true,
        message: "Buổi tập đã được lấy thành công",
        data: { workout },
      });
    } catch (error) {
      logger.error("❌ Get workout failed", {
        error: error.message,
        userId: req.user?._id,
        workoutId: req.params.workoutId,
      });

      if (error.message === "Workout not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy buổi tập",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem buổi tập này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy buổi tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update workout
   */
  async updateWorkout(req, res) {
    try {
      const userId = req.user._id;
      const { workoutId } = req.params;
      const updates = req.body;

      // Update workout
      const workout = await workoutService.updateWorkout(
        workoutId,
        userId,
        updates
      );

      logger.info("✅ Workout updated", {
        userId,
        workoutId,
        updates: Object.keys(updates),
      });

      res.json({
        success: true,
        message: "Buổi tập đã được cập nhật thành công",
        data: { workout },
      });
    } catch (error) {
      logger.error("❌ Update workout failed", {
        error: error.message,
        userId: req.user?._id,
        workoutId: req.params.workoutId,
      });

      if (error.message === "Workout not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy buổi tập",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa buổi tập này",
        });
      }

      if (error.message === "Cannot update completed workout") {
        return res.status(400).json({
          success: false,
          message: "Không thể chỉnh sửa buổi tập đã hoàn thành",
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật buổi tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Delete workout
   */
  async deleteWorkout(req, res) {
    try {
      const userId = req.user._id;
      const { workoutId } = req.params;

      // Delete workout
      await workoutService.deleteWorkout(workoutId, userId);

      logger.info("✅ Workout deleted", {
        userId,
        workoutId,
      });

      res.json({
        success: true,
        message: "Buổi tập đã được xóa thành công",
      });
    } catch (error) {
      logger.error("❌ Delete workout failed", {
        error: error.message,
        userId: req.user?._id,
        workoutId: req.params.workoutId,
      });

      if (error.message === "Workout not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy buổi tập",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa buổi tập này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Xóa buổi tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get workout statistics
   */
  async getWorkoutStats(req, res) {
    try {
      const userId = req.user._id;
      const { days = 30 } = req.query;

      // Get workout statistics
      const stats = await workoutService.getWorkoutStatistics(
        userId,
        parseInt(days)
      );

      logger.info("✅ Workout statistics retrieved", {
        userId,
        days,
      });

      res.json({
        success: true,
        message: "Thống kê buổi tập đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get workout statistics failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thống kê buổi tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get workout trends
   */
  async getWorkoutTrends(req, res) {
    try {
      const userId = req.user._id;
      const { days = 30 } = req.query;

      // Get workout trends
      const trends = await workoutService.getWorkoutTrends(
        userId,
        parseInt(days)
      );

      logger.info("✅ Workout trends retrieved", {
        userId,
        days,
      });

      res.json({
        success: true,
        message: "Xu hướng buổi tập đã được lấy thành công",
        data: { trends },
      });
    } catch (error) {
      logger.error("❌ Get workout trends failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy xu hướng buổi tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = workoutController;
