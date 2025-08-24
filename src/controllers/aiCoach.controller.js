const aiCoachService = require("../services/aiCoach.service");
const logger = require("../utils/logger.util");

/**
 * AI Coach controller for personalized fitness coaching
 * Handles AI-driven recommendations and coaching sessions
 */
const aiCoachController = {
  /**
   * Initialize AI Coach for user
   */
  async initializeCoach(req, res) {
    try {
      const userId = req.user._id;
      const userData = req.body;

      const coach = await aiCoachService.initializeCoach(userId, userData);

      logger.info("✅ AI Coach initialized successfully", {
        userId,
        coachId: coach._id,
      });

      res.status(201).json({
        success: true,
        message: "AI Coach đã được khởi tạo thành công",
        data: { coach },
      });
    } catch (error) {
      logger.error("❌ Initialize AI Coach failed", {
        error: error.message,
        userId: req.user?._id,
        userData: req.body,
      });

      res.status(500).json({
        success: false,
        message: "Khởi tạo AI Coach thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Start coaching session
   */
  async startSession(req, res) {
    try {
      const userId = req.user._id;
      const { sessionType, totalSteps = 5 } = req.body;

      if (!sessionType) {
        return res.status(400).json({
          success: false,
          message: "Loại phiên coaching là bắt buộc",
        });
      }

      const session = await aiCoachService.startSession(
        userId,
        sessionType,
        totalSteps
      );

      logger.info("✅ Coaching session started successfully", {
        userId,
        sessionId: session.sessionId,
        sessionType,
      });

      res.json({
        success: true,
        message: "Phiên coaching đã được bắt đầu thành công",
        data: { session },
      });
    } catch (error) {
      logger.error("❌ Start coaching session failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "AI Coach không tìm thấy. Vui lòng khởi tạo trước",
        });
      }

      res.status(500).json({
        success: false,
        message: "Bắt đầu phiên coaching thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get personalized workout recommendation
   */
  async getWorkoutRecommendation(req, res) {
    try {
      const userId = req.user._id;
      const context = req.body;

      const recommendation = await aiCoachService.getWorkoutRecommendation(
        userId,
        context
      );

      logger.info("✅ Workout recommendation generated successfully", {
        userId,
        recommendationId: recommendation.id,
      });

      res.json({
        success: true,
        message: "Khuyến nghị bài tập đã được tạo thành công",
        data: { recommendation },
      });
    } catch (error) {
      logger.error("❌ Get workout recommendation failed", {
        error: error.message,
        userId: req.user?._id,
        context: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "AI Coach không tìm thấy",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo khuyến nghị bài tập thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get personalized nutrition advice
   */
  async getNutritionAdvice(req, res) {
    try {
      const userId = req.user._id;
      const context = req.body;

      const advice = await aiCoachService.getNutritionAdvice(userId, context);

      logger.info("✅ Nutrition advice generated successfully", {
        userId,
        adviceId: advice.id,
      });

      res.json({
        success: true,
        message: "Lời khuyên dinh dưỡng đã được tạo thành công",
        data: { advice },
      });
    } catch (error) {
      logger.error("❌ Get nutrition advice failed", {
        error: error.message,
        userId: req.user?._id,
        context: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "AI Coach không tìm thấy",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo lời khuyên dinh dưỡng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get motivational content
   */
  async getMotivationalContent(req, res) {
    try {
      const userId = req.user._id;
      const context = req.body;

      const content = await aiCoachService.getMotivationalContent(
        userId,
        context
      );

      logger.info("✅ Motivational content generated successfully", {
        userId,
        contentType: content.type,
      });

      res.json({
        success: true,
        message: "Nội dung động viên đã được tạo thành công",
        data: { content },
      });
    } catch (error) {
      logger.error("❌ Get motivational content failed", {
        error: error.message,
        userId: req.user?._id,
        context: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "AI Coach không tìm thấy",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo nội dung động viên thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update session progress
   */
  async updateSessionProgress(req, res) {
    try {
      const userId = req.user._id;
      const { step, rating, comment = "" } = req.body;

      if (!step || !rating) {
        return res.status(400).json({
          success: false,
          message: "Bước và đánh giá là bắt buộc",
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Đánh giá phải từ 1-5",
        });
      }

      const result = await aiCoachService.updateSessionProgress(
        userId,
        step,
        rating,
        comment
      );

      logger.info("✅ Session progress updated successfully", {
        userId,
        currentStep: result.currentStep,
        rating,
      });

      res.json({
        success: true,
        message: "Tiến độ phiên coaching đã được cập nhật thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Update session progress failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "AI Coach không tìm thấy",
        });
      }

      if (error.message.includes("No active session")) {
        return res.status(400).json({
          success: false,
          message: "Không có phiên coaching nào đang hoạt động",
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
   * Complete coaching session
   */
  async completeSession(req, res) {
    try {
      const userId = req.user._id;
      const { topics, recommendations, notes = "" } = req.body;

      if (!topics || !recommendations) {
        return res.status(400).json({
          success: false,
          message: "Chủ đề và khuyến nghị là bắt buộc",
        });
      }

      const session = await aiCoachService.completeSession(
        userId,
        topics,
        recommendations,
        notes
      );

      logger.info("✅ Coaching session completed successfully", {
        userId,
        sessionId: session.sessionId,
        satisfaction: session.userSatisfaction,
      });

      res.json({
        success: true,
        message: "Phiên coaching đã được hoàn thành thành công",
        data: { session },
      });
    } catch (error) {
      logger.error("❌ Complete coaching session failed", {
        error: error.message,
        userId: req.user?._id,
        body: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "AI Coach không tìm thấy",
        });
      }

      if (error.message.includes("No active session")) {
        return res.status(400).json({
          success: false,
          message: "Không có phiên coaching nào để hoàn thành",
        });
      }

      res.status(500).json({
        success: false,
        message: "Hoàn thành phiên coaching thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Adapt coach based on user feedback
   */
  async adaptCoach(req, res) {
    try {
      const userId = req.user._id;
      const feedback = req.body;

      if (!feedback || Object.keys(feedback).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Phản hồi từ người dùng là bắt buộc",
        });
      }

      const result = await aiCoachService.adaptCoach(userId, feedback);

      logger.info("✅ AI Coach adapted successfully", {
        userId,
        changesCount: result.changes.length,
      });

      res.json({
        success: true,
        message: "AI Coach đã được điều chỉnh thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Adapt AI Coach failed", {
        error: error.message,
        userId: req.user?._id,
        feedback: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "AI Coach không tìm thấy",
        });
      }

      res.status(500).json({
        success: false,
        message: "Điều chỉnh AI Coach thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get coach insights and statistics
   */
  async getCoachInsights(req, res) {
    try {
      const userId = req.user._id;

      const insights = await aiCoachService.getCoachInsights(userId);

      logger.info("✅ Coach insights retrieved successfully", {
        userId,
        totalSessions: insights.totalSessions,
      });

      res.json({
        success: true,
        message: "Thông tin AI Coach đã được lấy thành công",
        data: { insights },
      });
    } catch (error) {
      logger.error("❌ Get coach insights failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "AI Coach không tìm thấy",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy thông tin AI Coach thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = aiCoachController;
