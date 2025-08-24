const mongoose = require("mongoose");

/**
 * Photo model for storing image metadata
 * Links photos to specific contexts (meals, workouts, body progress)
 */
const photoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contextType: {
      type: String,
      enum: ["meal", "workout", "body", "profile"],
      required: [true, "Loại context là bắt buộc"],
    },
    contextId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "ID context là bắt buộc"],
    },
    fileKey: {
      type: String,
      required: [true, "File key là bắt buộc"],
      unique: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ["image/jpeg", "image/png", "image/webp"],
    },
    size: {
      type: Number,
      required: true,
      min: [1024, "File size phải từ 1KB trở lên"],
      max: [5242880, "File size không được quá 5MB"],
    },
    dimensions: {
      width: {
        type: Number,
        required: true,
        min: [100, "Chiều rộng phải từ 100px trở lên"],
        max: [4000, "Chiều rộng không được quá 4000px"],
      },
      height: {
        type: Number,
        required: true,
        min: [100, "Chiều cao phải từ 100px trở lên"],
        max: [4000, "Chiều cao không được quá 4000px"],
      },
    },
    takenAt: {
      type: Date,
      required: [true, "Thời gian chụp là bắt buộc"],
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    tags: [String],
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Mô tả không được quá 500 ký tự"],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    aiAnalysis: {
      confidence: Number,
      tags: [String],
      description: String,
      analyzedAt: Date,
    },
    metadata: {
      camera: String,
      settings: {
        iso: Number,
        shutterSpeed: String,
        aperture: String,
        focalLength: Number,
      },
      gps: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
photoSchema.index({ userId: 1, contextType: 1 });
photoSchema.index({ userId: 1, takenAt: -1 });
photoSchema.index({ fileKey: 1 });
photoSchema.index({ tags: 1 });

// Virtuals
photoSchema.virtual("aspectRatio").get(function () {
  return (this.dimensions.width / this.dimensions.height).toFixed(2);
});

photoSchema.virtual("fileSizeMB").get(function () {
  return (this.size / (1024 * 1024)).toFixed(2);
});

photoSchema.virtual("isLandscape").get(function () {
  return this.dimensions.width > this.dimensions.height;
});

photoSchema.virtual("isPortrait").get(function () {
  return this.dimensions.height > this.dimensions.width;
});

photoSchema.virtual("isSquare").get(function () {
  return this.dimensions.width === this.dimensions.height;
});

// Instance methods
photoSchema.methods = {
  /**
   * Get photo URL
   */
  getPhotoUrl() {
    return `/uploads/${this.contextType}/${this.fileKey}`;
  },

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl() {
    return `/uploads/${this.contextType}/thumbnails/${this.fileKey}`;
  },

  /**
   * Check if photo is high resolution
   */
  isHighResolution() {
    return this.dimensions.width >= 1920 || this.dimensions.height >= 1920;
  },

  /**
   * Get photo category based on context
   */
  getPhotoCategory() {
    const categories = {
      meal: "food",
      workout: "fitness",
      body: "progress",
      profile: "avatar",
    };
    return categories[this.contextType] || "other";
  },
};

// Static methods
photoSchema.statics = {
  /**
   * Get photos by context
   */
  async getPhotosByContext(userId, contextType, contextId) {
    return this.find({
      userId,
      contextType,
      contextId,
    }).sort({ takenAt: -1 });
  },

  /**
   * Get user photo statistics
   */
  async getUserPhotoStats(userId) {
    return this.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: "$contextType",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" },
          avgSize: { $avg: "$size" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  },

  /**
   * Get photos by date range
   */
  async getPhotosByDateRange(userId, startDate, endDate) {
    return this.find({
      userId,
      takenAt: { $gte: startDate, $lte: endDate },
    }).sort({ takenAt: -1 });
  },
};

module.exports = mongoose.model("Photo", photoSchema);
