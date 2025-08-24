const Challenge = require("../models/challenge.model");
const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const Gamification = require("../models/gamification.model");
const logger = require("../utils/logger.util");

/**
 * Challenge service for managing fitness challenges
 * Handles challenge creation, participation, and progress tracking
 */
const challengeService = {
  /**
   * Create a new challenge
   */
  async createChallenge(challengeData, creatorId) {
    try {
      // Validate challenge data
      if (challengeData.startMode === "fixed") {
        if (!challengeData.startDate || !challengeData.endDate) {
          throw new Error("Fixed start mode requires start and end dates");
        }

        const startDate = new Date(challengeData.startDate);
        const endDate = new Date(challengeData.endDate);

        if (startDate >= endDate) {
          throw new Error("Start date must be before end date");
        }

        if (startDate <= new Date()) {
          throw new Error("Start date must be in the future");
        }

        challengeData.durationDays = Math.ceil(
          (endDate - startDate) / (1000 * 60 * 60 * 24)
        );
      }

      // Get creator info
      const creator = await User.findById(creatorId).select("fullName");
      if (!creator) {
        throw new Error("Creator not found");
      }

      // Create challenge
      const challenge = new Challenge({
        ...challengeData,
        creatorId,
        creatorName: creator.fullName,
        participants: [],
        totalParticipants: 0,
        activeParticipants: 0,
        currentDay: 0,
        metrics: {
          totalXP: 0,
          averageScore: 0,
          completionRate: 0,
          topScore: 0,
        },
      });

      await challenge.save();

      logger.info("✅ Challenge created successfully", {
        challengeId: challenge._id,
        creatorId,
        title: challenge.title,
      });

      return challenge;
    } catch (error) {
      logger.error("❌ Failed to create challenge", {
        error: error.message,
        creatorId,
        challengeData,
      });
      throw error;
    }
  },

  /**
   * Get challenges with filtering and pagination
   */
  async getChallenges(options = {}) {
    try {
      const {
        status,
        category,
        isPublic = true,
        isFeatured,
        limit = 20,
        page = 1,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (category) query.category = category;
      if (isPublic !== undefined) query.isPublic = isPublic;
      if (isFeatured !== undefined) query.isFeatured = isFeatured;

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Execute query
      const challenges = await Challenge.find(query)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .populate("creatorId", "fullName avatar")
        .populate("participants.userId", "fullName avatar");

      // Get total count
      const total = await Challenge.countDocuments(query);

      return {
        challenges,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("❌ Failed to get challenges", {
        error: error.message,
        options,
      });
      throw error;
    }
  },

  /**
   * Get challenge by ID with full details
   */
  async getChallengeById(challengeId, userId = null) {
    try {
      const challenge = await Challenge.findById(challengeId)
        .populate("creatorId", "fullName avatar email")
        .populate("participants.userId", "fullName avatar");

      if (!challenge) {
        throw new Error("Challenge not found");
      }

      // Add user-specific data if userId provided
      if (userId) {
        const participant = challenge.participants.find((p) =>
          p.userId._id.equals(userId)
        );
        challenge.userParticipation = participant || null;
        challenge.canJoin = challenge.canUserJoin({ _id: userId }, {});
      }

      return challenge;
    } catch (error) {
      logger.error("❌ Failed to get challenge by ID", {
        error: error.message,
        challengeId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Join a challenge
   */
  async joinChallenge(challengeId, userId) {
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }

      // Get user profile
      const userProfile = await Profile.findOne({ userId });
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      // Check if user can join
      const canJoin = challenge.canUserJoin({ _id: userId }, userProfile);
      if (!canJoin.canJoin) {
        throw new Error(canJoin.reason);
      }

      // Add participant
      const participant = challenge.addParticipant(userId, userProfile);
      await challenge.save();

      // Award XP for joining
      await this.awardJoinXP(userId, challenge);

      logger.info("✅ User joined challenge successfully", {
        challengeId,
        userId,
        participantId: participant._id,
      });

      return challenge;
    } catch (error) {
      logger.error("❌ Failed to join challenge", {
        error: error.message,
        challengeId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Leave a challenge
   */
  async leaveChallenge(challengeId, userId) {
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }

      // Remove participant
      const participant = challenge.removeParticipant(userId);
      await challenge.save();

      logger.info("✅ User left challenge successfully", {
        challengeId,
        userId,
      });

      return challenge;
    } catch (error) {
      logger.error("❌ Failed to leave challenge", {
        error: error.message,
        challengeId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Update challenge progress
   */
  async updateProgress(
    challengeId,
    userId,
    dayNumber,
    score,
    completed = true
  ) {
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }

      // Update participant progress
      const participant = challenge.updateParticipantProgress(
        userId,
        dayNumber,
        score,
        completed
      );
      await challenge.save();

      // Award XP for progress
      if (completed) {
        await this.awardProgressXP(userId, challenge, dayNumber, score);
      }

      logger.info("✅ Challenge progress updated", {
        challengeId,
        userId,
        dayNumber,
        score,
        completed,
      });

      return challenge;
    } catch (error) {
      logger.error("❌ Failed to update challenge progress", {
        error: error.message,
        challengeId,
        userId,
        dayNumber,
        score,
      });
      throw error;
    }
  },

  /**
   * Get challenge leaderboard
   */
  async getLeaderboard(challengeId, options = {}) {
    try {
      const { limit = 50, metric = "completion" } = options;

      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }

      let leaderboard = challenge.getLeaderboard(limit);

      // Sort by different metrics if specified
      if (metric === "score") {
        leaderboard.sort((a, b) => b.totalScore - a.totalScore);
      } else if (metric === "streak") {
        leaderboard.sort((a, b) => b.streakDays - a.streakDays);
      }

      // Populate user details
      const userIds = leaderboard.map((p) => p.userId);
      const users = await User.find({ _id: { $in: userIds } }).select(
        "fullName avatar"
      );

      // Map user details to leaderboard
      leaderboard = leaderboard.map((entry) => {
        const user = users.find((u) => u._id.equals(entry.userId));
        return {
          ...entry,
          user: user ? { fullName: user.fullName, avatar: user.avatar } : null,
        };
      });

      return leaderboard;
    } catch (error) {
      logger.error("❌ Failed to get challenge leaderboard", {
        error: error.message,
        challengeId,
        options,
      });
      throw error;
    }
  },

  /**
   * Get user's challenges
   */
  async getUserChallenges(userId, options = {}) {
    try {
      const { status, limit = 20, page = 1 } = options;

      // Build query
      const query = { "participants.userId": userId };
      if (status) {
        query["participants.status"] = status;
      }

      const challenges = await Challenge.find(query)
        .populate("creatorId", "fullName avatar")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      // Get total count
      const total = await Challenge.countDocuments(query);

      return {
        challenges,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("❌ Failed to get user challenges", {
        error: error.message,
        userId,
        options,
      });
      throw error;
    }
  },

  /**
   * Award XP for joining challenge
   */
  async awardJoinXP(userId, challenge) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (gamification) {
        const xpAmount = 50; // Base XP for joining
        gamification.addXP(xpAmount, `Joined challenge: ${challenge.title}`);
        await gamification.save();
      }
    } catch (error) {
      logger.error("❌ Failed to award join XP", {
        error: error.message,
        userId,
        challengeId: challenge._id,
      });
    }
  },

  /**
   * Award XP for challenge progress
   */
  async awardProgressXP(userId, challenge, dayNumber, score) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (gamification) {
        // Base XP for completing a day
        let xpAmount = 25;

        // Bonus XP for high scores
        if (score > 80) xpAmount += 15;
        if (score > 90) xpAmount += 10;

        // Streak bonus
        const participant = challenge.participants.find((p) =>
          p.userId.equals(userId)
        );
        if (participant && participant.progress.streakDays >= 7) {
          xpAmount += 20; // Weekly streak bonus
        }

        gamification.addXP(
          xpAmount,
          `Challenge progress: ${challenge.title} - Day ${dayNumber}`
        );
        await gamification.save();
      }
    } catch (error) {
      logger.error("❌ Failed to award progress XP", {
        error: error.message,
        userId,
        challengeId: challenge._id,
        dayNumber,
        score,
      });
    }
  },

  /**
   * Complete challenge for a user
   */
  async completeChallenge(challengeId, userId) {
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }

      const participant = challenge.participants.find((p) =>
        p.userId.equals(userId)
      );
      if (!participant) {
        throw new Error("User is not a participant");
      }

      if (participant.status === "completed") {
        throw new Error("Challenge already completed");
      }

      // Mark as completed
      participant.status = "completed";
      participant.progress.completedDays = challenge.durationDays;
      participant.progress.currentDay = challenge.durationDays;

      // Award completion XP
      await this.awardCompletionXP(userId, challenge);

      await challenge.save();

      logger.info("✅ Challenge completed successfully", {
        challengeId,
        userId,
      });

      return challenge;
    } catch (error) {
      logger.error("❌ Failed to complete challenge", {
        error: error.message,
        challengeId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Award XP for challenge completion
   */
  async awardCompletionXP(userId, challenge) {
    try {
      const gamification = await Gamification.findOne({ userId });
      if (gamification) {
        // Base completion XP
        let xpAmount = 500;

        // Bonus XP based on performance
        const participant = challenge.participants.find((p) =>
          p.userId.equals(userId)
        );
        if (participant) {
          const completionRate =
            (participant.progress.completedDays / challenge.durationDays) * 100;
          if (completionRate >= 90) xpAmount += 200; // High completion bonus
          if (participant.progress.streakDays >= challenge.durationDays * 0.8) {
            xpAmount += 300; // Consistency bonus
          }
        }

        gamification.addXP(xpAmount, `Challenge completed: ${challenge.title}`);
        await gamification.save();
      }
    } catch (error) {
      logger.error("❌ Failed to award completion XP", {
        error: error.message,
        userId,
        challengeId: challenge._id,
      });
    }
  },
};

module.exports = challengeService;
