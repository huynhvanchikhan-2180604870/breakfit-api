const Workout = require("../models/workout.model");
const logger = require("../utils/logger.util");

/**
 * Workout service for exercise tracking operations
 * Handles workout sessions, exercises, and statistics
 */
const workoutService = {
  /**
   * Start workout session
   */
  async startWorkoutSession(userId, workoutData) {
    try {
      const { workoutType, name, notes, targetDuration } = workoutData;

      const workout = new Workout({
        userId,
        workoutType,
        name,
        notes,
        targetDuration,
        startTime: new Date(),
        status: "active",
      });

      await workout.save();

      logger.info("✅ Workout session started", {
        userId,
        workoutId: workout._id,
        workoutType,
        name,
      });
      return workout;
    } catch (error) {
      logger.error("❌ Start workout session failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * End workout session
   */
  async endWorkoutSession(workoutId, userId, endData) {
    try {
      const workout = await Workout.findOne({ _id: workoutId, userId });

      if (!workout) {
        throw new Error("Workout not found");
      }

      if (workout.status === "completed") {
        throw new Error("Workout already ended");
      }

      const endTime = new Date();
      const duration = Math.round((endTime - workout.startTime) / (1000 * 60)); // Duration in minutes

      workout.endTime = endTime;
      workout.duration = duration;
      workout.status = "completed";
      workout.notes = endData.notes || workout.notes;
      workout.rating = endData.rating;

      await workout.save();

      logger.info("✅ Workout session ended", {
        userId,
        workoutId,
        duration,
        caloriesBurned: workout.caloriesBurned,
      });
      return workout;
    } catch (error) {
      logger.error("❌ End workout session failed", {
        error: error.message,
        userId,
        workoutId,
      });
      throw error;
    }
  },

  /**
   * Add exercise to workout
   */
  async addExerciseToWorkout(workoutId, userId, exerciseData) {
    try {
      const workout = await Workout.findOne({ _id: workoutId, userId });

      if (!workout) {
        throw new Error("Workout not found");
      }

      if (workout.status === "completed") {
        throw new Error("Cannot add exercise to completed workout");
      }

      const exercise = {
        exerciseName: exerciseData.exerciseName,
        sets: exerciseData.sets,
        reps: exerciseData.reps,
        weight: exerciseData.weight,
        duration: exerciseData.duration,
        distance: exerciseData.distance,
        calories: exerciseData.calories,
        notes: exerciseData.notes,
      };

      workout.exercises.push(exercise);
      await workout.save();

      logger.info("✅ Exercise added to workout", {
        userId,
        workoutId,
        exerciseName: exerciseData.exerciseName,
      });
      return exercise;
    } catch (error) {
      logger.error("❌ Add exercise to workout failed", {
        error: error.message,
        userId,
        workoutId,
      });
      throw error;
    }
  },

  /**
   * Get workout entries with pagination
   */
  async getWorkoutEntries(userId, options = {}) {
    try {
      const { startDate, endDate, workoutType, limit = 30, page = 1 } = options;
      const skip = (page - 1) * limit;

      const query = { userId };

      if (startDate && endDate) {
        query.startTime = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (workoutType) {
        query.workoutType = workoutType;
      }

      const entries = await Workout.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Workout.countDocuments(query);

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };

      logger.info("✅ Workout entries retrieved", {
        userId,
        count: entries.length,
        total,
      });
      return { entries, pagination };
    } catch (error) {
      logger.error("❌ Get workout entries failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get workout by ID
   */
  async getWorkoutById(workoutId, userId) {
    try {
      const workout = await Workout.findOne({ _id: workoutId, userId });

      if (!workout) {
        throw new Error("Workout not found");
      }

      logger.info("✅ Workout retrieved", { userId, workoutId });
      return workout;
    } catch (error) {
      logger.error("❌ Get workout by ID failed", {
        error: error.message,
        userId,
        workoutId,
      });
      throw error;
    }
  },

  /**
   * Update workout
   */
  async updateWorkout(workoutId, userId, updates) {
    try {
      const workout = await Workout.findOne({ _id: workoutId, userId });

      if (!workout) {
        throw new Error("Workout not found");
      }

      if (workout.status === "completed") {
        throw new Error("Cannot update completed workout");
      }

      Object.assign(workout, updates);
      await workout.save();

      logger.info("✅ Workout updated", {
        userId,
        workoutId,
        updates: Object.keys(updates),
      });
      return workout;
    } catch (error) {
      logger.error("❌ Update workout failed", {
        error: error.message,
        userId,
        workoutId,
      });
      throw error;
    }
  },

  /**
   * Delete workout
   */
  async deleteWorkout(workoutId, userId) {
    try {
      const workout = await Workout.findOneAndDelete({
        _id: workoutId,
        userId,
      });

      if (!workout) {
        throw new Error("Workout not found");
      }

      logger.info("✅ Workout deleted", { userId, workoutId });
      return true;
    } catch (error) {
      logger.error("❌ Delete workout failed", {
        error: error.message,
        userId,
        workoutId,
      });
      throw error;
    }
  },

  /**
   * Get workout statistics
   */
  async getWorkoutStatistics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const workouts = await Workout.find({
        userId,
        startTime: { $gte: startDate },
        status: "completed",
      });

      const stats = {
        totalWorkouts: workouts.length,
        totalDuration: 0,
        totalCalories: 0,
        averageDuration: 0,
        averageCalories: 0,
        workoutTypeDistribution: {},
        mostFrequentExercise: null,
      };

      if (workouts.length > 0) {
        const totalDuration = workouts.reduce(
          (sum, workout) => sum + (workout.duration || 0),
          0
        );
        const totalCalories = workouts.reduce(
          (sum, workout) => sum + (workout.caloriesBurned || 0),
          0
        );

        stats.totalDuration = totalDuration;
        stats.totalCalories = totalCalories;
        stats.averageDuration = Math.round(totalDuration / workouts.length);
        stats.averageCalories = Math.round(totalCalories / workouts.length);

        // Workout type distribution
        const workoutTypes = {};
        workouts.forEach((workout) => {
          workoutTypes[workout.workoutType] =
            (workoutTypes[workout.workoutType] || 0) + 1;
        });
        stats.workoutTypeDistribution = workoutTypes;
      }

      logger.info("✅ Workout statistics retrieved", {
        userId,
        days,
        totalWorkouts: stats.totalWorkouts,
      });
      return stats;
    } catch (error) {
      logger.error("❌ Get workout statistics failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get workout trends
   */
  async getWorkoutTrends(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const workouts = await Workout.find({
        userId,
        startTime: { $gte: startDate },
        status: "completed",
      }).sort({ startTime: 1 });

      const trends = {
        period: days,
        totalWorkouts: workouts.length,
        averageWorkoutsPerWeek:
          Math.round((workouts.length / days) * 7 * 10) / 10,
        totalDuration: workouts.reduce(
          (sum, workout) => sum + (workout.duration || 0),
          0
        ),
        totalCalories: workouts.reduce(
          (sum, workout) => sum + (workout.caloriesBurned || 0),
          0
        ),
        consistency: 0, // Will be calculated based on frequency
      };

      logger.info("✅ Workout trends retrieved", {
        userId,
        days,
        totalWorkouts: trends.totalWorkouts,
      });
      return trends;
    } catch (error) {
      logger.error("❌ Get workout trends failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },
};

module.exports = workoutService;
