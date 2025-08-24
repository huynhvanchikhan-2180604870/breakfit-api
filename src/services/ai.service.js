const aiConfig = require("../config/ai.config");
const Photo = require("../models/photo.model");
const logger = require("../utils/logger.util");

/**
 * AI service for Gemini-powered features
 * Handles meal analysis, body analysis, and AI recommendations
 */
const aiService = {
  /**
   * Analyze meal photo
   */
  async analyzeMealPhoto(photoId, userId) {
    try {
      if (!aiConfig.isAvailable()) {
        throw new Error("AI service not available");
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

      logger.info("✅ Meal photo analyzed successfully", {
        photoId,
        userId,
        foodItems: analysis.foodItems?.length || 0,
        calories: analysis.estimatedCalories,
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
   * Analyze body progress photo
   */
  async analyzeBodyPhoto(photoId, userId) {
    try {
      if (!aiConfig.isAvailable()) {
        throw new Error("AI service not available");
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

      logger.info("✅ Body photo analyzed successfully", {
        photoId,
        userId,
        fitnessLevel: analysis.fitnessLevel,
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
  async getNutritionRecommendations(userProfile, goals) {
    try {
      if (!aiConfig.isAvailable()) {
        throw new Error("AI service not available");
      }

      const prompt = `
        Provide personalized nutrition recommendations in Vietnamese for a fitness enthusiast.
        
        User Profile:
        - Age: ${userProfile.age || "N/A"}
        - Weight: ${userProfile.currentWeightKg}kg
        - Height: ${userProfile.heightCm}cm
        - Activity Level: ${userProfile.activityLevel}
        - Goal: ${goals.primaryGoal}
        - Target Weight: ${goals.targetWeight}kg
        
        Please provide:
        1. Daily calorie target
        2. Macro breakdown (protein, carbs, fat)
        3. Meal timing recommendations
        4. Food suggestions
        5. Supplements (if needed)
        6. Hydration tips
        
        Format as JSON:
        {
          "dailyCalories": 2000,
          "macros": {
            "protein": 150,
            "carbs": 200,
            "fat": 67
          },
          "mealTiming": ["7:00 AM", "10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM"],
          "foodSuggestions": {
            "breakfast": ["suggestion1", "suggestion2"],
            "lunch": ["suggestion1", "suggestion2"],
            "dinner": ["suggestion1", "suggestion2"],
            "snacks": ["suggestion1", "suggestion2"]
          },
          "supplements": ["supplement1", "supplement2"],
          "hydration": "2-3 liters per day",
          "tips": ["tip1", "tip2", "tip3"]
        }
      `;

      // Get recommendations from Gemini
      const model = aiConfig.getModel("geminiPro");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const recommendations = this.parseAIResponse(text);

      logger.info("✅ Nutrition recommendations generated", {
        userId: userProfile.userId,
        dailyCalories: recommendations.dailyCalories,
      });

      return recommendations;
    } catch (error) {
      logger.error("❌ Nutrition recommendations failed", {
        error: error.message,
        userId: userProfile.userId,
      });
      throw error;
    }
  },

  /**
   * Get workout recommendations
   */
  async getWorkoutRecommendations(userProfile, preferences) {
    try {
      if (!aiConfig.isAvailable()) {
        throw new Error("AI service not available");
      }

      const prompt = `
        Provide personalized workout recommendations in Vietnamese.
        
        User Profile:
        - Age: ${userProfile.age || "N/A"}
        - Weight: ${userProfile.currentWeightKg}kg
        - Height: ${userProfile.heightCm}cm
        - Activity Level: ${userProfile.activityLevel}
        - Goal: ${preferences.goal}
        - Experience: ${preferences.experience}
        - Available Time: ${preferences.availableTime} minutes
        - Equipment: ${preferences.equipment}
        
        Please provide:
        1. Workout frequency
        2. Exercise selection
        3. Sets and reps
        4. Rest periods
        5. Progression plan
        6. Safety tips
        
        Format as JSON:
        {
          "frequency": "3-4 times per week",
          "workouts": [
            {
              "day": "Day 1 - Upper Body",
              "exercises": [
                {
                  "name": "Push-ups",
                  "sets": 3,
                  "reps": "8-12",
                  "rest": "60 seconds"
                }
              ]
            }
          ],
          "progression": "Increase weight by 5% every 2 weeks",
          "safetyTips": ["tip1", "tip2"],
          "estimatedDuration": 45
        }
      `;

      // Get recommendations from Gemini
      const model = aiConfig.getModel("geminiPro");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const recommendations = this.parseAIResponse(text);

      logger.info("✅ Workout recommendations generated", {
        userId: userProfile.userId,
        frequency: recommendations.frequency,
      });

      return recommendations;
    } catch (error) {
      logger.error("❌ Workout recommendations failed", {
        error: error.message,
        userId: userProfile.userId,
      });
      throw error;
    }
  },

  /**
   * Get progress insights
   */
  async getProgressInsights(userData, timeRange = "30 days") {
    try {
      if (!aiConfig.isAvailable()) {
        throw new Error("AI service not available");
      }

      const prompt = `
        Analyze this fitness progress data and provide insights in Vietnamese.
        
        User Data (${timeRange}):
        - Weight Changes: ${JSON.stringify(userData.weightChanges)}
        - Workout Frequency: ${userData.workoutFrequency}
        - Nutrition Adherence: ${userData.nutritionAdherence}%
        - Goals: ${userData.goals}
        
        Please provide:
        1. Progress assessment
        2. What's working well
        3. Areas for improvement
        4. Recommendations
        5. Motivation tips
        
        Format as JSON:
        {
          "progressAssessment": "positive/neutral/negative",
          "workingWell": ["point1", "point2"],
          "improvements": ["area1", "area2"],
          "recommendations": ["rec1", "rec2"],
          "motivation": "encouraging message",
          "nextSteps": ["step1", "step2"]
        }
      `;

      // Get insights from Gemini
      const model = aiConfig.getModel("geminiPro");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const insights = this.parseAIResponse(text);

      logger.info("✅ Progress insights generated", {
        userId: userData.userId,
        assessment: insights.progressAssessment,
      });

      return insights;
    } catch (error) {
      logger.error("❌ Progress insights failed", {
        error: error.message,
        userId: userData.userId,
      });
      throw error;
    }
  },

  /**
   * Helper: Read image file
   */
  async readImageFile(filePath) {
    try {
      const fs = require("fs").promises;
      const imageBuffer = await fs.readFile(filePath);
      return imageBuffer;
    } catch (error) {
      logger.error("❌ Failed to read image file", {
        error: error.message,
        filePath,
      });
      return null;
    }
  },

  /**
   * Helper: Parse AI response
   */
  parseAIResponse(text) {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: return raw text
      return { rawResponse: text };
    } catch (error) {
      logger.error("❌ Failed to parse AI response", {
        error: error.message,
        text,
      });
      return { error: "Failed to parse AI response", rawResponse: text };
    }
  },

  /**
   * Get AI service status
   */
  // ... existing code ...

  /**
   * Get AI service status
   */
  getStatus() {
    return aiConfig.getStatus();
  },

  /**
   * Create AI analysis job (Async processing)
   */
  async createAnalysisJob(photoId, userId, analysisType) {
    try {
      if (!aiConfig.isAvailable()) {
        throw new Error("AI service not available");
      }

      // Generate unique job ID
      const jobId = `ai_job_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create job record in memory (in production, use Redis/database)
      const job = {
        id: jobId,
        photoId,
        userId,
        type: analysisType,
        status: "pending",
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        result: null,
        error: null,
        retryCount: 0,
        maxRetries: 3,
      };

      // Store job (in production, save to database)
      this.jobs = this.jobs || new Map();
      this.jobs.set(jobId, job);

      // Process job asynchronously
      this.processJobAsync(jobId);

      logger.info("✅ AI analysis job created", {
        jobId,
        photoId,
        userId,
        analysisType,
      });

      return { jobId, status: "pending" };
    } catch (error) {
      logger.error("❌ Failed to create AI analysis job", {
        error: error.message,
        photoId,
        userId,
        analysisType,
      });
      throw error;
    }
  },

  /**
   * Get job status and result
   */
  async getJobStatus(jobId) {
    try {
      const job = this.jobs?.get(jobId);
      if (!job) {
        throw new Error("Job not found");
      }

      const response = {
        jobId: job.id,
        status: job.status,
        type: job.type,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      };

      if (job.status === "completed") {
        response.result = job.result;
      } else if (job.status === "failed") {
        response.error = job.error;
      }

      return response;
    } catch (error) {
      logger.error("❌ Failed to get job status", {
        error: error.message,
        jobId,
      });
      throw error;
    }
  },

  /**
   * Process job asynchronously
   */
  async processJobAsync(jobId) {
    try {
      const job = this.jobs.get(jobId);
      if (!job) return;

      // Update job status
      job.status = "processing";
      job.startedAt = new Date();
      this.jobs.set(jobId, job);

      let result;
      if (job.type === "meal") {
        result = await this.analyzeMealPhoto(job.photoId, job.userId);
      } else if (job.type === "body") {
        result = await this.analyzeBodyPhoto(job.photoId, job.userId);
      } else {
        throw new Error(`Unknown analysis type: ${job.type}`);
      }

      // Validate AI confidence
      if (result.confidence && result.confidence < 0.7) {
        throw new Error(`AI confidence too low: ${result.confidence}`);
      }

      // Update job as completed
      job.status = "completed";
      job.completedAt = new Date();
      job.result = result;
      this.jobs.set(jobId, job);

      logger.info("✅ AI analysis job completed", {
        jobId,
        photoId: job.photoId,
        userId: job.userId,
        type: job.type,
        confidence: result.confidence,
      });
    } catch (error) {
      // Handle job failure
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = "failed";
        job.error = error.message;
        job.completedAt = new Date();

        // Retry logic
        if (job.retryCount < job.maxRetries) {
          job.retryCount++;
          job.status = "pending";
          job.error = null;
          job.startedAt = null;
          job.completedAt = null;

          // Retry after delay
          setTimeout(() => this.processJobAsync(jobId), 5000 * job.retryCount);
        }

        this.jobs.set(jobId, job);
      }

      logger.error("❌ AI analysis job failed", {
        error: error.message,
        jobId,
        photoId: job?.photoId,
        userId: job?.userId,
        type: job?.type,
        retryCount: job?.retryCount,
      });
    }
  },

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId, limit = 20) {
    try {
      const userJobs = [];
      for (const [jobId, job] of this.jobs || []) {
        if (job.userId === userId) {
          userJobs.push({
            jobId: job.id,
            status: job.status,
            type: job.type,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
          });
        }
      }

      // Sort by creation date (newest first)
      userJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return userJobs.slice(0, limit);
    } catch (error) {
      logger.error("❌ Failed to get user jobs", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysToKeep = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let cleanedCount = 0;
      for (const [jobId, job] of this.jobs || []) {
        if (job.status === "completed" && job.completedAt < cutoffDate) {
          this.jobs.delete(jobId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`✅ Cleaned up ${cleanedCount} old AI analysis jobs`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error("❌ Failed to cleanup old jobs", {
        error: error.message,
      });
      return 0;
    }
  },

  /**
   * Get AI service statistics
   */
  async getServiceStats() {
    try {
      const stats = {
        totalJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        averageProcessingTime: 0,
        successRate: 0,
      };

      if (this.jobs) {
        let totalTime = 0;
        let completedCount = 0;

        for (const [jobId, job] of this.jobs) {
          stats.totalJobs++;

          if (job.status === "pending") stats.pendingJobs++;
          else if (job.status === "processing") stats.processingJobs++;
          else if (job.status === "completed") {
            stats.completedJobs++;
            if (job.startedAt && job.completedAt) {
              totalTime += job.completedAt - job.startedAt;
              completedCount++;
            }
          } else if (job.status === "failed") stats.failedJobs++;
        }

        if (completedCount > 0) {
          stats.averageProcessingTime = totalTime / completedCount;
        }

        if (stats.totalJobs > 0) {
          stats.successRate = (stats.completedJobs / stats.totalJobs) * 100;
        }
      }

      return stats;
    } catch (error) {
      logger.error("❌ Failed to get service stats", {
        error: error.message,
      });
      return null;
    }
  },
};

module.exports = aiService;
