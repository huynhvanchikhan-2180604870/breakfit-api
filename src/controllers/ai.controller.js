const aiService = require("../services/ai.service");
const logger = require("../utils/logger.util");

/**
 * AI controller for Gemini-powered features
 * Handles AI analysis requests and responses
 */
const aiController = {
  /**
   * Analyze meal photo
   */
  async analyzeMealPhoto(photoId, userId) {
    try {
      if (!aiConfig.isAvailable()) {
        throw new Error("AI service not available");
      }

      // Check cache first
      const cacheKey = aiConfig.generateCacheKey(photoId, "meal", userId);
      const cached = aiConfig.getCachedResponse(cacheKey);
      if (cached) {
        logger.info("✅ Meal analysis served from cache", { photoId, userId });
        return cached;
      }

      // Get photo
      const photo = await Photo.findOne({ _id: photoId, userId });
      if (!photo) {
        throw new Error("Photo not found");
      }

      // Read image file
      const imageBuffer = await this.readImageFile(photo.filePath);
      if (!imageBuffer) {
        throw new Error("Could not read image file");
      }

      // Prepare prompt for meal analysis
      const prompt = `
        Analyze this food image and provide detailed nutrition information in Vietnamese.
        
        Please identify:
        1. Food items present in the image
        2. Estimated calories (kcal)
        3. Protein content (grams)
        4. Carbohydrate content (grams)
        5. Fat content (grams)
        6. Any health warnings or recommendations
        
        Format the response as JSON with the following structure:
        {
          "foodItems": ["item1", "item2"],
          "estimatedCalories": 300,
          "protein": 25,
          "carbohydrates": 30,
          "fat": 10,
          "confidence": 0.85,
          "warnings": ["warning1", "warning2"],
          "recommendations": ["rec1", "rec2"]
        }
        
        Be as accurate as possible with Vietnamese food items.
      `;

      // Analyze with Gemini Vision
      const model = aiConfig.getModel("geminiProVision");
      const result = await model.generateContent([prompt, imageBuffer]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const analysis = this.parseAIResponse(text);

      // Validate confidence
      if (analysis.confidence) {
        aiConfig.validateConfidence(analysis.confidence);
      }

      // Cache the result
      aiConfig.setCachedResponse(cacheKey, analysis);

      logger.info("✅ Meal photo analyzed successfully", {
        photoId,
        userId,
        foodItems: analysis.foodItems?.length || 0,
        calories: analysis.estimatedCalories,
        confidence: analysis.confidence,
      });

      return analysis;
    } catch (error) {
      logger.error("❌ Meal photo analysis failed", {
        error: error.message,
        photoId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Analyze body progress photo with caching
   */
  async analyzeBodyPhoto(photoId, userId) {
    try {
      if (!aiConfig.isAvailable()) {
        throw new Error("AI service not available");
      }

      // Check cache first
      const cacheKey = aiConfig.generateCacheKey(photoId, "body", userId);
      const cached = aiConfig.getCachedResponse(cacheKey);
      if (cached) {
        logger.info("✅ Body analysis served from cache", { photoId, userId });
        return cached;
      }

      // Get photo
      const photo = await Photo.findOne({ _id: photoId, userId });
      if (!photo) {
        throw new Error("Photo not found");
      }

      // Read image file
      const imageBuffer = await this.readImageFile(photo.filePath);
      if (!imageBuffer) {
        throw new Error("Could not read image file");
      }

      // Prepare prompt for body analysis
      const prompt = `
        Analyze this body progress photo and provide fitness insights in Vietnamese.
        
        Please identify:
        1. Visible muscle definition
        2. Body composition changes (if comparing with previous photos)
        3. Posture assessment
        4. General fitness level indicators
        5. Recommendations for improvement
        
        Format the response as JSON with the following structure:
        {
          "muscleDefinition": "low/medium/high",
          "bodyComposition": "lean/muscular/balanced",
          "posture": "good/fair/poor",
          "fitnessLevel": "beginner/intermediate/advanced",
          "observations": ["obs1", "obs2"],
          "recommendations": ["rec1", "rec2"],
          "confidence": 0.85
        }
        
        Be encouraging and constructive in your analysis.
      `;

      // Analyze with Gemini Vision
      const model = aiConfig.getModel("geminiProVision");
      const result = await model.generateContent([prompt, imageBuffer]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const analysis = this.parseAIResponse(text);

      // Validate confidence
      if (analysis.confidence) {
        aiConfig.validateConfidence(analysis.confidence);
      }

      // Cache the result
      aiConfig.setCachedResponse(cacheKey, analysis);

      logger.info("✅ Body photo analyzed successfully", {
        photoId,
        userId,
        fitnessLevel: analysis.fitnessLevel,
        confidence: analysis.confidence,
      });

      return analysis;
    } catch (error) {
      logger.error("❌ Body photo analysis failed", {
        error: error.message,
        photoId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get nutrition recommendations
   */
  async getNutritionRecommendations(req, res) {
    try {
      const userId = req.user._id;
      const { userProfile, goals } = req.body;

      if (!userProfile || !goals) {
        return res.status(400).json({
          success: false,
          message: "Thông tin hồ sơ và mục tiêu là bắt buộc",
        });
      }

      // Get nutrition recommendations
      const recommendations = await aiService.getNutritionRecommendations(
        { ...userProfile, userId },
        goals
      );

      logger.info("✅ Nutrition recommendations generated", {
        userId,
        dailyCalories: recommendations.dailyCalories,
      });

      res.json({
        success: true,
        message: "Khuyến nghị dinh dưỡng đã được tạo thành công",
        data: { recommendations },
      });
    } catch (error) {
      logger.error("❌ Nutrition recommendations failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "AI service not available") {
        return res.status(503).json({
          success: false,
          message: "Dịch vụ AI hiện không khả dụng",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo khuyến nghị dinh dưỡng thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get workout recommendations
   */
  async getWorkoutRecommendations(req, res) {
    try {
      const userId = req.user._id;
      const { userProfile, preferences } = req.body;

      if (!userProfile || !preferences) {
        return res.status(400).json({
          success: false,
          message: "Thông tin hồ sơ và tùy chọn là bắt buộc",
        });
      }

      // Get workout recommendations
      const recommendations = await aiService.getWorkoutRecommendations(
        { ...userProfile, userId },
        preferences
      );

      logger.info("✅ Workout recommendations generated", {
        userId,
        frequency: recommendations.frequency,
      });

      res.json({
        success: true,
        message: "Khuyến nghị bài tập đã được tạo thành công",
        data: { recommendations },
      });
    } catch (error) {
      logger.error("❌ Workout recommendations failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "AI service not available") {
        return res.status(503).json({
          success: false,
          message: "Dịch vụ AI hiện không khả dụng",
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
   * Get progress insights
   */
  async getProgressInsights(req, res) {
    try {
      const userId = req.user._id;
      const { userData, timeRange = "30 days" } = req.body;

      if (!userData) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu người dùng là bắt buộc",
        });
      }

      // Get progress insights
      const insights = await aiService.getProgressInsights(
        { ...userData, userId },
        timeRange
      );

      logger.info("✅ Progress insights generated", {
        userId,
        assessment: insights.progressAssessment,
      });

      res.json({
        success: true,
        message: "Phân tích tiến độ đã được tạo thành công",
        data: { insights },
      });
    } catch (error) {
      logger.error("❌ Progress insights failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "AI service not available") {
        return res.status(503).json({
          success: false,
          message: "Dịch vụ AI hiện không khả dụng",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo phân tích tiến độ thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get AI service status
   */
  async getAIStatus(req, res) {
    try {
      const status = aiService.getStatus();
      const stats = await aiService.getServiceStats();

      logger.info("✅ AI status retrieved");

      res.json({
        success: true,
        message: "Trạng thái AI đã được lấy thành công",
        data: {
          status,
          stats,
        },
      });
    } catch (error) {
      logger.error("❌ Get AI status failed", {
        error: error.message,
      });

      res.status(500).json({
        success: false,
        message: "Lấy trạng thái AI thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Create AI analysis job (Async)
   */
  async createAnalysisJob(req, res) {
    try {
      const userId = req.user._id;
      const { photoId, analysisType } = req.body;

      if (!photoId || !analysisType) {
        return res.status(400).json({
          success: false,
          message: "Photo ID và loại phân tích là bắt buộc",
        });
      }

      if (!["meal", "body"].includes(analysisType)) {
        return res.status(400).json({
          success: false,
          message: "Loại phân tích phải là 'meal' hoặc 'body'",
        });
      }

      // Create analysis job
      const job = await aiService.createAnalysisJob(
        photoId,
        userId,
        analysisType
      );

      logger.info("✅ AI analysis job created", {
        userId,
        photoId,
        analysisType,
        jobId: job.jobId,
      });

      res.status(202).json({
        success: true,
        message: "Đã tạo job phân tích AI",
        data: { job },
      });
    } catch (error) {
      logger.error("❌ Create AI analysis job failed", {
        error: error.message,
        userId: req.user?._id,
        photoId: req.body.photoId,
        analysisType: req.body.analysisType,
      });

      if (error.message === "AI service not available") {
        return res.status(503).json({
          success: false,
          message: "Dịch vụ AI hiện không khả dụng",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo job phân tích AI thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get AI analysis job status
   */
  async getJobStatus(req, res) {
    try {
      const userId = req.user._id;
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "Job ID là bắt buộc",
        });
      }

      // Get job status
      const job = await aiService.getJobStatus(jobId);

      // Verify job ownership
      if (job.userId && job.userId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập job này",
        });
      }

      logger.info("✅ AI job status retrieved", {
        userId,
        jobId,
        status: job.status,
      });

      res.json({
        success: true,
        message: "Trạng thái job đã được lấy thành công",
        data: { job },
      });
    } catch (error) {
      logger.error("❌ Get AI job status failed", {
        error: error.message,
        userId: req.user?._id,
        jobId: req.params.jobId,
      });

      if (error.message === "Job not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy job",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy trạng thái job thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user's AI analysis jobs
   */
  async getUserJobs(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 20 } = req.query;

      // Get user jobs
      const jobs = await aiService.getUserJobs(userId, parseInt(limit));

      logger.info("✅ User AI jobs retrieved", {
        userId,
        jobCount: jobs.length,
      });

      res.json({
        success: true,
        message: "Danh sách job đã được lấy thành công",
        data: { jobs },
      });
    } catch (error) {
      logger.error("❌ Get user AI jobs failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách job thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = aiController;
