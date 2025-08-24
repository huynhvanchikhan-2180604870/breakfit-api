const mongoose = require("mongoose");
const logger = require("../utils/logger.util");

/**
 * Gamification Schema
 * Handles XP, levels, achievements, and rewards system
 */
const gamificationSchema = new mongoose.Schema(
  {
    // User association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // XP & Level System
    currentXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentLevel: {
      type: Number,
      default: 1,
      min: 1,
    },
    levelProgress: {
      type: Number,
      default: 0, // Percentage to next level
      min: 0,
      max: 100,
    },
    xpToNextLevel: {
      type: Number,
      default: 100,
    },

    // Streaks & Consistency
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDate: Date,
    streakType: {
      type: String,
      enum: ["workout", "nutrition", "weight", "general"],
      default: "general",
    },

    // Achievements & Badges
    achievements: [
      {
        achievementId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Achievement",
        },
        name: String,
        description: String,
        icon: String,
        category: String,
        unlockedAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          current: Number,
          target: Number,
          percentage: Number,
        },
        rarity: {
          type: String,
          enum: ["common", "rare", "epic", "legendary"],
          default: "common",
        },
        xpReward: Number,
      },
    ],
    totalAchievements: {
      type: Number,
      default: 0,
    },
    achievementPoints: {
      type: Number,
      default: 0,
    },

    // Daily & Weekly Challenges
    dailyChallenges: [
      {
        challengeId: String,
        title: String,
        description: String,
        type: String,
        target: Number,
        current: Number,
        completed: {
          type: Boolean,
          default: false,
        },
        xpReward: Number,
        expiresAt: Date,
      },
    ],
    weeklyChallenges: [
      {
        challengeId: String,
        title: String,
        description: String,
        type: String,
        target: Number,
        current: Number,
        completed: {
          type: Boolean,
          default: false,
        },
        xpReward: Number,
        expiresAt: Date,
        progress: [
          {
            date: Date,
            value: Number,
          },
        ],
      },
    ],

    // Quests & Missions
    activeQuests: [
      {
        questId: String,
        title: String,
        description: String,
        type: String,
        objectives: [
          {
            description: String,
            target: Number,
            current: Number,
            completed: Boolean,
          },
        ],
        rewards: {
          xp: Number,
          coins: Number,
          items: [String],
        },
        expiresAt: Date,
        startedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    completedQuests: [
      {
        questId: String,
        title: String,
        completedAt: Date,
        rewards: {
          xp: Number,
          coins: Number,
          items: [String],
        },
      },
    ],

    // Virtual Currency & Shop
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    gems: {
      type: Number,
      default: 0,
      min: 0,
    },
    inventory: [
      {
        itemId: String,
        name: String,
        type: String,
        quantity: Number,
        acquiredAt: Date,
        expiresAt: Date,
      },
    ],

    // Statistics & Records
    stats: {
      totalWorkouts: { type: Number, default: 0 },
      totalCaloriesBurned: { type: Number, default: 0 },
      totalDistance: { type: Number, default: 0 },
      totalWeightLost: { type: Number, default: 0 },
      totalMealsLogged: { type: Number, default: 0 },
      totalDaysActive: { type: Number, default: 0 },
      bestWorkout: { type: Number, default: 0 },
      longestWorkout: { type: Number, default: 0 },
    },
    records: [
      {
        type: String,
        value: Number,
        date: Date,
        description: String,
      },
    ],

    // Social & Competition
    leaderboardRank: {
      type: Number,
      default: 0,
    },
    friendsRank: {
      type: Number,
      default: 0,
    },
    globalRank: {
      type: Number,
      default: 0,
    },
    trophies: [
      {
        type: String,
        name: String,
        description: String,
        earnedAt: Date,
        rank: Number,
      },
    ],

    // XP History & Analytics
    xpHistory: [
      {
        amount: Number,
        source: String,
        description: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        category: String,
      },
    ],
    levelHistory: [
      {
        level: Number,
        xpRequired: Number,
        achievedAt: {
          type: Date,
          default: Date.now,
        },
        timeToLevel: Number, // Days to reach this level
      },
    ],

    // Settings & Preferences
    notifications: {
      levelUp: { type: Boolean, default: true },
      achievement: { type: Boolean, default: true },
      streak: { type: Boolean, default: true },
      challenge: { type: Boolean, default: true },
      quest: { type: Boolean, default: true },
    },
    privacy: {
      showLevel: { type: Boolean, default: true },
      showAchievements: { type: Boolean, default: true },
      showStats: { type: Boolean, default: true },
      showLeaderboard: { type: Boolean, default: true },
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
gamificationSchema.index({ userId: 1 });
gamificationSchema.index({ currentLevel: -1, currentXP: -1 });
gamificationSchema.index({ "achievements.rarity": 1 });
gamificationSchema.index({ "dailyChallenges.expiresAt": 1 });
gamificationSchema.index({ "weeklyChallenges.expiresAt": 1 });

// Virtual fields
gamificationSchema.virtual("levelTitle").get(function () {
  const titles = [
    "Beginner",
    "Fitness Enthusiast",
    "Workout Warrior",
    "Health Champion",
    "Fitness Master",
    "Elite Athlete",
    "Fitness Legend",
    "Ultimate Champion",
  ];
  return (
    titles[Math.min(this.currentLevel - 1, titles.length - 1)] ||
    "Fitness Master"
  );
});

gamificationSchema.virtual("nextLevelXP").get(function () {
  return this.xpToNextLevel;
});

gamificationSchema.virtual("isNearLevelUp").get(function () {
  return this.levelProgress >= 80;
});

gamificationSchema.virtual("totalAchievementPoints").get(function () {
  return this.achievements.reduce(
    (sum, achievement) => sum + (achievement.xpReward || 0),
    0
  );
});

// Instance methods
gamificationSchema.methods.addXP = function (
  amount,
  source,
  description,
  category = "general"
) {
  if (amount <= 0) {
    throw new Error("XP amount must be positive");
  }

  // Add XP
  this.currentXP += amount;
  this.totalXP += amount;

  // Record in history
  this.xpHistory.push({
    amount,
    source,
    description,
    category,
    timestamp: new Date(),
  });

  // Check for level up
  this.checkLevelUp();

  // Update level progress
  this.updateLevelProgress();

  return this;
};

gamificationSchema.methods.checkLevelUp = function () {
  while (this.currentXP >= this.xpToNextLevel) {
    this.currentXP -= this.xpToNextLevel;
    this.currentLevel++;

    // Calculate XP for next level (exponential growth)
    this.xpToNextLevel = Math.floor(100 * Math.pow(1.5, this.currentLevel - 1));

    // Record level up
    this.levelHistory.push({
      level: this.currentLevel,
      xpRequired: this.xpToNextLevel,
      achievedAt: new Date(),
      timeToLevel: this.calculateTimeToLevel(),
    });

    logger.info("🎉 Level up!", {
      userId: this.userId,
      newLevel: this.currentLevel,
      xpToNext: this.xpToNextLevel,
    });
  }
};

gamificationSchema.methods.updateLevelProgress = function () {
  if (this.xpToNextLevel > 0) {
    this.levelProgress = Math.round(
      (this.currentXP / this.xpToNextLevel) * 100
    );
  }
};

gamificationSchema.methods.updateStreak = function (activityType = "general") {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastActivityDate) {
    // First activity
    this.currentStreak = 1;
    this.lastActivityDate = today;
    this.streakType = activityType;
  } else {
    const lastDate = new Date(this.lastActivityDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = today - lastDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      this.currentStreak++;
      this.lastActivityDate = today;
    } else if (diffDays === 0) {
      // Same day, no change
      return this.currentStreak;
    } else {
      // Streak broken
      this.currentStreak = 1;
      this.lastActivityDate = today;
      this.streakType = activityType;
    }
  }

  // Update longest streak
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }

  return this.currentStreak;
};

gamificationSchema.methods.addAchievement = function (achievement) {
  // Check if already unlocked
  const existing = this.achievements.find((a) =>
    a.achievementId.equals(achievement._id)
  );
  if (existing) {
    return false; // Already unlocked
  }

  // Add achievement
  this.achievements.push({
    achievementId: achievement._id,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category,
    rarity: achievement.rarity,
    xpReward: achievement.xpReward,
    progress: {
      current: achievement.target,
      target: achievement.target,
      percentage: 100,
    },
  });

  this.totalAchievements++;
  this.achievementPoints += achievement.xpReward;

  // Award XP
  this.addXP(
    achievement.xpReward,
    "achievement",
    `Unlocked: ${achievement.name}`
  );

  logger.info("🏆 Achievement unlocked!", {
    userId: this.userId,
    achievement: achievement.name,
    xpReward: achievement.xpReward,
  });

  return true;
};

gamificationSchema.methods.updateChallengeProgress = function (
  challengeType,
  challengeId,
  progress
) {
  let challenges;
  if (challengeType === "daily") {
    challenges = this.dailyChallenges;
  } else if (challengeType === "weekly") {
    challenges = this.weeklyChallenges;
  } else {
    throw new Error("Invalid challenge type");
  }

  const challenge = challenges.find((c) => c.challengeId === challengeId);
  if (!challenge) {
    throw new Error("Challenge not found");
  }

  challenge.current = progress;
  challenge.completed = progress >= challenge.target;

  if (challenge.completed && !challenge.rewarded) {
    // Award XP
    this.addXP(
      challenge.xpReward,
      "challenge",
      `Completed: ${challenge.title}`
    );
    challenge.rewarded = true;
  }

  return challenge;
};

gamificationSchema.methods.addQuest = function (quest) {
  // Check if already active
  const existing = this.activeQuests.find((q) => q.questId === quest.questId);
  if (existing) {
    throw new Error("Quest already active");
  }

  this.activeQuests.push({
    questId: quest.questId,
    title: quest.title,
    description: quest.description,
    type: quest.type,
    objectives: quest.objectives.map((obj) => ({
      ...obj,
      current: 0,
      completed: false,
    })),
    rewards: quest.rewards,
    expiresAt: quest.expiresAt,
    startedAt: new Date(),
  });

  return this;
};

gamificationSchema.methods.updateQuestProgress = function (
  questId,
  objectiveIndex,
  progress
) {
  const quest = this.activeQuests.find((q) => q.questId === questId);
  if (!quest) {
    throw new Error("Quest not found");
  }

  if (objectiveIndex < 0 || objectiveIndex >= quest.objectives.length) {
    throw new Error("Invalid objective index");
  }

  const objective = quest.objectives[objectiveIndex];
  objective.current = progress;
  objective.completed = progress >= objective.target;

  // Check if all objectives completed
  const allCompleted = quest.objectives.every((obj) => obj.completed);
  if (allCompleted) {
    this.completeQuest(quest);
  }

  return quest;
};

gamificationSchema.methods.completeQuest = function (quest) {
  // Remove from active quests
  const questIndex = this.activeQuests.findIndex(
    (q) => q.questId === quest.questId
  );
  if (questIndex === -1) {
    throw new Error("Quest not found in active quests");
  }

  this.activeQuests.splice(questIndex, 1);

  // Add to completed quests
  this.completedQuests.push({
    questId: quest.questId,
    title: quest.title,
    completedAt: new Date(),
    rewards: quest.rewards,
  });

  // Award rewards
  if (quest.rewards.xp) {
    this.addXP(quest.rewards.xp, "quest", `Completed: ${quest.title}`);
  }
  if (quest.rewards.coins) {
    this.coins += quest.rewards.coins;
  }

  logger.info(" Quest completed!", {
    userId: this.userId,
    quest: quest.title,
    rewards: quest.rewards,
  });

  return quest;
};

gamificationSchema.methods.addCoins = function (amount, source) {
  if (amount <= 0) {
    throw new Error("Coin amount must be positive");
  }

  this.coins += amount;
  return this;
};

gamificationSchema.methods.spendCoins = function (amount, item) {
  if (amount <= 0) {
    throw new Error("Coin amount must be positive");
  }

  if (this.coins < amount) {
    throw new Error("Insufficient coins");
  }

  this.coins -= amount;

  // Add item to inventory
  if (item) {
    this.inventory.push({
      itemId: item.id,
      name: item.name,
      type: item.type,
      quantity: 1,
      acquiredAt: new Date(),
      expiresAt: item.expiresAt,
    });
  }

  return this;
};

gamificationSchema.methods.updateStats = function (
  statType,
  value,
  operation = "add"
) {
  if (!this.stats[statType]) {
    this.stats[statType] = 0;
  }

  if (operation === "add") {
    this.stats[statType] += value;
  } else if (operation === "set") {
    this.stats[statType] = value;
  } else if (operation === "max") {
    this.stats[statType] = Math.max(this.stats[statType], value);
  }

  return this;
};

gamificationSchema.methods.addRecord = function (type, value, description) {
  this.records.push({
    type,
    value,
    date: new Date(),
    description,
  });

  // Keep only top 10 records per type
  const typeRecords = this.records.filter((r) => r.type === type);
  if (typeRecords.length > 10) {
    typeRecords.sort((a, b) => b.value - a.value);
    this.records = this.records.filter((r) => r.type !== type);
    this.records.push(...typeRecords.slice(0, 10));
  }

  return this;
};

// Helper methods
gamificationSchema.methods.calculateTimeToLevel = function () {
  if (this.levelHistory.length < 2) return 0;

  const lastLevel = this.levelHistory[this.levelHistory.length - 1];
  const previousLevel = this.levelHistory[this.levelHistory.length - 2];

  const timeDiff = lastLevel.achievedAt - previousLevel.achievedAt;
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

// Static methods
gamificationSchema.statics.getLeaderboard = function (limit = 100) {
  return this.find()
    .sort({ currentLevel: -1, currentXP: -1 })
    .limit(limit)
    .populate("userId", "fullName avatar");
};

gamificationSchema.statics.getTopAchievers = function (limit = 50) {
  return this.find()
    .sort({ totalAchievements: -1, achievementPoints: -1 })
    .limit(limit)
    .populate("userId", "fullName avatar");
};

// Pre-save middleware
gamificationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Gamification = mongoose.model("Gamification", gamificationSchema);

module.exports = Gamification;
