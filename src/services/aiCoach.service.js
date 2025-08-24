const AICoach = require("../models/aiCoach.model");
const User = require("../models/user.model");
const aiService = require("./ai.service");
const logger = require("../utils/logger.util");

/**
 * AI Coach service for personalized fitness coaching
 * Handles AI-driven recommendations and adaptive learning
 */
const aiCoachService = {
  /**
   * Initialize AI Coach for user
   */
  async initializeCoach(userId, userData = {}) {
    try {
      // Check if coach already exists
      let coach = await AICoach.findOne({ userId });
      if (coach) {
        return coach;
      }

      // Get user profile
      const user = await User.findById(userId).select("fullName email");
      if (!user) {
        throw new Error("User not found");
      }

      // Create new coach with default settings
      coach = new AICoach({
        userId,
        coachName: `Coach ${user.fullName?.split(" ")[0] || "AI"}`,
        userGoals: userData.goals || ["general_fitness"],
        fitnessLevel: userData.fitnessLevel || "beginner",
        preferredWorkoutTypes: userData.workoutTypes || ["cardio"],
        timeAvailability: userData.timeAvailability || "30min",
        equipmentAccess: userData.equipment || ["none"],
        aiModelVersion: "1.0.0",
        modelParameters: {
          learningRate: 0.1,
          adaptationThreshold: 0.7,
          personalizationWeight: 0.8,
        },
      });

      await coach.save();

      logger.info("✅ AI Coach initialized successfully", {
        userId,
        coachId: coach._id,
        coachName: coach.coachName,
      });

      return coach;
    } catch (error) {
      logger.error("❌ Failed to initialize AI Coach", {
        error: error.message,
        userId,
        userData,
      });
      throw error;
    }
  },

  /**
   * Start coaching session
   */
  async startSession(userId, sessionType, totalSteps = 5) {
    try {
      const coach = await AICoach.findOne({ userId });
      if (!coach) {
        throw new Error("AI Coach not found. Please initialize first.");
      }

      // Start session
      coach.startSession(sessionType, totalSteps);
      await coach.save();

      logger.info("✅ Coaching session started successfully", {
        userId,
        sessionId: coach.activeSession.sessionId,
        sessionType,
        totalSteps,
      });

      return coach.activeSession;
    } catch (error) {
      logger.error("❌ Failed to start coaching session", {
        error: error.message,
        userId,
        sessionType,
      });
      throw error;
    }
  },

  /**
   * Get personalized workout recommendation
   */
  async getWorkoutRecommendation(userId, context = {}) {
    try {
      const coach = await AICoach.findOne({ userId });
      if (!coach) {
        throw new Error("AI Coach not found");
      }

      // Build AI prompt based on user profile and context
      const prompt = this.buildWorkoutPrompt(coach, context);

      // Get AI recommendation
      const aiResponse = await aiService.getWorkoutRecommendation(prompt);

      // Parse and structure the response
      const recommendation = this.parseWorkoutRecommendation(aiResponse, coach);

      // Store user response for learning
      coach.addUserResponse(
        "workout_preference",
        JSON.stringify(context),
        "workout"
      );

      await coach.save();

      logger.info("✅ Workout recommendation generated successfully", {
        userId,
        recommendationId: recommendation.id,
        workoutType: recommendation.type,
      });

      return recommendation;
    } catch (error) {
      logger.error("❌ Failed to get workout recommendation", {
        error: error.message,
        userId,
        context,
      });
      throw error;
    }
  },

  /**
   * Get personalized nutrition advice
   */
  async getNutritionAdvice(userId, context = {}) {
    try {
      const coach = await AICoach.findOne({ userId });
      if (!coach) {
        throw new Error("AI Coach not found");
      }

      // Build AI prompt
      const prompt = this.buildNutritionPrompt(coach, context);

      // Get AI recommendation
      const aiResponse = await aiService.getNutritionRecommendation(prompt);

      // Parse response
      const advice = this.parseNutritionAdvice(aiResponse, coach);

      // Store for learning
      coach.addUserResponse(
        "nutrition_preference",
        JSON.stringify(context),
        "nutrition"
      );

      await coach.save();

      logger.info("✅ Nutrition advice generated successfully", {
        userId,
        adviceId: advice.id,
        mealType: advice.mealType,
      });

      return advice;
    } catch (error) {
      logger.error("❌ Failed to get nutrition advice", {
        error: error.message,
        userId,
        context,
      });
      throw error;
    }
  },

  /**
   * Get motivational content
   */
  async getMotivationalContent(userId, context = {}) {
    try {
      const coach = await AICoach.findOne({ userId });
      if (!coach) {
        throw new Error("AI Coach not found");
      }

      // Check if we have effective content in history
      const effectiveContent = coach.motivationalContent
        .filter((content) => content.effectiveness >= 70)
        .sort((a, b) => b.lastUsed - a.lastUsed);

      if (effectiveContent.length > 0 && Math.random() > 0.3) {
        // Use proven content 70% of the time
        const content = effectiveContent[0];
        content.lastUsed = new Date();
        await coach.save();

        return {
          type: "proven",
          content: content.content,
          context: content.context,
          effectiveness: content.effectiveness,
        };
      }

      // Generate new content with AI
      const prompt = this.buildMotivationPrompt(coach, context);
      const aiResponse = await aiService.getMotivationalContent(prompt);

      const newContent = {
        type: "ai_generated",
        content: aiResponse.content,
        context: aiResponse.context,
        effectiveness: 50, // Will be updated based on user feedback
      };

      // Store new content
      coach.motivationalContent.push({
        type: "tip",
        content: newContent.content,
        context: newContent.context,
        effectiveness: newContent.effectiveness,
        lastUsed: new Date(),
      });

      await coach.save();

      logger.info("✅ Motivational content generated successfully", {
        userId,
        contentType: newContent.type,
        effectiveness: newContent.effectiveness,
      });

      return newContent;
    } catch (error) {
      logger.error("❌ Failed to get motivational content", {
        error: error.message,
        userId,
        context,
      });
      throw error;
    }
  },

  /**
   * Update session progress
   */
  async updateSessionProgress(userId, step, rating, comment = "") {
    try {
      const coach = await AICoach.findOne({ userId });
      if (!coach) {
        throw new Error("AI Coach not found");
      }

      if (!coach.activeSession) {
        throw new Error("No active session");
      }

      // Add feedback
      coach.addFeedback(step, rating, comment);

      // Move to next step
      const nextStep = coach.nextStep();

      await coach.save();

      logger.info("✅ Session progress updated successfully", {
        userId,
        sessionId: coach.activeSession?.sessionId,
        currentStep: coach.activeSession?.currentStep,
        rating,
      });

      return {
        currentStep: coach.activeSession?.currentStep,
        nextStep,
        isCompleted: !nextStep,
      };
    } catch (error) {
      logger.error("❌ Failed to update session progress", {
        error: error.message,
        userId,
        step,
        rating,
      });
      throw error;
    }
  },

  /**
   * Complete coaching session
   */
  async completeSession(userId, topics, recommendations, notes = "") {
    try {
      const coach = await AICoach.findOne({ userId });
      if (!coach) {
        throw new Error("AI Coach not found");
      }

      if (!coach.activeSession) {
        throw new Error("No active session to complete");
      }

      // Complete session
      const session = coach.completeSession(topics, recommendations, notes);

      // Update learning progress
      if (session.userSatisfaction >= 4) {
        coach.learningProgress.successfulRecommendations++;
      }

      coach.learningProgress.userSatisfaction = Math.round(
        (coach.learningProgress.userSatisfaction *
          (coach.learningProgress.totalSessions - 1) +
          session.userSatisfaction) /
          coach.learningProgress.totalSessions
      );

      await coach.save();

      logger.info("✅ Coaching session completed successfully", {
        userId,
        sessionId: session.sessionId,
        satisfaction: session.userSatisfaction,
        effectiveness: session.effectiveness,
      });

      return session;
    } catch (error) {
      logger.error("❌ Failed to complete coaching session", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Adapt coach based on user feedback
   */
  async adaptCoach(userId, feedback) {
    try {
      const coach = await AICoach.findOne({ userId });
      if (!coach) {
        throw new Error("AI Coach not found");
      }

      const changes = [];

      // Analyze feedback and adapt
      if (feedback.workoutPreferences) {
        const oldTypes = [...coach.preferredWorkoutTypes];
        coach.preferredWorkoutTypes = feedback.workoutPreferences;
        changes.push({
          field: "preferredWorkoutTypes",
          oldValue: oldTypes,
          newValue: feedback.workoutPreferences,
          reason: "User feedback on workout preferences",
        });
      }

      if (feedback.fitnessLevel) {
        const oldLevel = coach.fitnessLevel;
        coach.fitnessLevel = feedback.fitnessLevel;
        changes.push({
          field: "fitnessLevel",
          oldValue: oldLevel,
          newValue: feedback.fitnessLevel,
          reason: "User fitness level change",
        });
      }

      if (feedback.timeAvailability) {
        const oldTime = coach.timeAvailability;
        coach.timeAvailability = feedback.timeAvailability;
        changes.push({
          field: "timeAvailability",
          oldValue: oldTime,
          newValue: feedback.timeAvailability,
          reason: "User time availability change",
        });
      }

      // Adapt coach if significant changes
      if (changes.length > 0) {
        coach.adaptToUser("user_feedback", changes);
      }

      await coach.save();

      logger.info("✅ AI Coach adapted successfully", {
        userId,
        changesCount: changes.length,
        changes: changes.map((c) => c.field),
      });

      return { changes, adaptationDate: new Date() };
    } catch (error) {
      logger.error("❌ Failed to adapt AI Coach", {
        error: error.message,
        userId,
        feedback,
      });
      throw error;
    }
  },

  /**
   * Get coach insights and statistics
   */
  async getCoachInsights(userId) {
    try {
      const coach = await AICoach.findOne({ userId });
      if (!coach) {
        throw new Error("AI Coach not found");
      }

      const insights = {
        totalSessions: coach.learningProgress.totalSessions,
        averageSatisfaction: coach.averageSatisfaction,
        successRate: coach.successRate,
        coachingExperience: coach.coachingExperience,
        recentAdaptations: coach.adaptationHistory.slice(-5).map((a) => ({
          date: a.date,
          trigger: a.trigger,
          changesCount: a.changes.length,
        })),
        topWorkoutTypes: this.analyzeWorkoutPreferences(coach),
        nutritionTrends: this.analyzeNutritionPatterns(coach),
        motivationalEffectiveness: this.analyzeMotivationalContent(coach),
      };

      return insights;
    } catch (error) {
      logger.error("❌ Failed to get coach insights", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  // Helper methods for building AI prompts
  buildWorkoutPrompt(coach, context) {
    return `As a fitness coach for a ${
      coach.fitnessLevel
    } level user with goals: ${coach.userGoals.join(
      ", "
    )}, preferred workout types: ${coach.preferredWorkoutTypes.join(
      ", "
    )}, time available: ${
      coach.timeAvailability
    }, and equipment: ${coach.equipmentAccess.join(
      ", "
    )}, recommend a personalized workout. Context: ${JSON.stringify(
      context
    )}. Provide structured workout with exercises, sets, reps, and rest periods.`;
  },

  buildNutritionPrompt(coach, context) {
    return `As a nutrition coach for a user with fitness goals: ${coach.userGoals.join(
      ", "
    )}, fitness level: ${
      coach.fitnessLevel
    }, provide personalized nutrition advice. Context: ${JSON.stringify(
      context
    )}. Include meal suggestions, portion sizes, and timing recommendations.`;
  },

  buildMotivationPrompt(coach, context) {
    return `As a motivational coach for a ${
      coach.coachPersonality
    } style coach, provide encouraging content for a user working on ${coach.userGoals.join(
      ", "
    )}. Context: ${JSON.stringify(context)}. Make it personal and actionable.`;
  },

  // Helper methods for parsing AI responses
  parseWorkoutRecommendation(aiResponse, coach) {
    // This would parse the AI response into structured workout data
    // For now, return a basic structure
    return {
      id: `workout_${Date.now()}`,
      type: "personalized",
      content: aiResponse,
      generatedAt: new Date(),
      coachId: coach._id,
    };
  },

  parseNutritionAdvice(aiResponse, coach) {
    return {
      id: `nutrition_${Date.now()}`,
      mealType: "general",
      content: aiResponse,
      generatedAt: new Date(),
      coachId: coach._id,
    };
  },

  // Analysis methods
  analyzeWorkoutPreferences(coach) {
    const workoutCounts = {};
    coach.coachingSessions
      .filter((s) => s.type === "workout")
      .forEach((session) => {
        session.topics.forEach((topic) => {
          workoutCounts[topic] = (workoutCounts[topic] || 0) + 1;
        });
      });

    return Object.entries(workoutCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));
  },

  analyzeNutritionPatterns(coach) {
    const nutritionSessions = coach.coachingSessions.filter(
      (s) => s.type === "nutrition"
    );
    return {
      totalSessions: nutritionSessions.length,
      averageEffectiveness:
        nutritionSessions.length > 0
          ? Math.round(
              nutritionSessions.reduce((sum, s) => sum + s.effectiveness, 0) /
                nutritionSessions.length
            )
          : 0,
    };
  },

  analyzeMotivationalContent(coach) {
    const motivationalSessions = coach.coachingSessions.filter(
      (s) => s.type === "motivation"
    );
    return {
      totalSessions: motivationalSessions.length,
      averageSatisfaction:
        motivationalSessions.length > 0
          ? Math.round(
              motivationalSessions.reduce(
                (sum, s) => sum + s.userSatisfaction,
                0
              ) / motivationalSessions.length
            )
          : 0,
    };
  },
};

module.exports = aiCoachService;
