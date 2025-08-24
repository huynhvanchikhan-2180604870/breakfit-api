const Photo = require("../models/photo.model");
const Event = require("../models/event.model");
const multerConfig = require("../config/multer.config");
const logger = require("../utils/logger.util");
const path = require("path");
const fs = require("fs-extra");
const sharp = require("sharp");

/**
 * Photo service for image upload, processing, and management
 * Handles file operations, image optimization, and AI analysis
 */
const photoService = {
  /**
   * Upload photo with processing
   */
  async uploadPhoto(userId, file, contextType, contextId, metadata = {}) {
    try {
      // Validate file
      if (!file) {
        throw new Error("Không có file được upload");
      }

      // Get file info
      const fileInfo = await this.getFileInfo(file.path);

      // Create photo record
      const photo = new Photo({
        userId,
        contextType,
        contextId,
        fileKey: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        dimensions: {
          width: fileInfo.width,
          height: fileInfo.height,
        },
        takenAt: metadata.takenAt || new Date(),
        location: metadata.location,
        tags: metadata.tags || [],
        description: metadata.description,
        isPublic: metadata.isPublic || false,
      });

      await photo.save();

      // Process image (create thumbnails, optimize)
      await this.processImage(photo);

      // Log event
      await Event.createEvent(
        userId,
        "photo.uploaded",
        "Photo uploaded",
        `Photo uploaded for ${contextType}`,
        { contextType, contextId, fileSize: file.size },
        { userId, photoId: photo._id }
      );

      logger.info("✅ Photo uploaded successfully", {
        userId,
        photoId: photo._id,
        contextType,
        contextId,
      });

      return photo;
    } catch (error) {
      logger.error("❌ Photo upload failed", {
        error: error.message,
        userId,
        contextType,
        contextId,
      });
      throw error;
    }
  },

  /**
   * Get file information
   */
  async getFileInfo(filePath) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha,
        hasProfile: metadata.hasProfile,
        isOpaque: metadata.isOpaque,
      };
    } catch (error) {
      logger.error("❌ File info extraction failed", {
        error: error.message,
        filePath,
      });
      throw error;
    }
  },

  /**
   * Process uploaded image
   */
  async processImage(photo) {
    try {
      const sourcePath = path.join(
        multerConfig.uploadPath,
        photo.contextType,
        photo.fileKey
      );
      const thumbnailPath = path.join(
        multerConfig.uploadPath,
        photo.contextType,
        "thumbnails",
        photo.fileKey
      );

      // Ensure thumbnail directory exists
      await fs.ensureDir(path.dirname(thumbnailPath));

      // Create thumbnail (300x300, maintain aspect ratio)
      await sharp(sourcePath)
        .resize(300, 300, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Optimize original image if too large
      if (photo.dimensions.width > 1920 || photo.dimensions.height > 1920) {
        const optimizedPath = sourcePath.replace(/\.[^/.]+$/, "_optimized.jpg");

        await sharp(sourcePath)
          .resize(1920, 1920, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toFile(optimizedPath);

        // Replace original with optimized
        await fs.remove(sourcePath);
        await fs.move(optimizedPath, sourcePath);

        // Update photo dimensions
        const optimizedInfo = await this.getFileInfo(sourcePath);
        photo.dimensions = {
          width: optimizedInfo.width,
          height: optimizedInfo.height,
        };
        await photo.save();
      }

      logger.info("✅ Image processing completed", { photoId: photo._id });
    } catch (error) {
      logger.error("❌ Image processing failed", {
        error: error.message,
        photoId: photo._id,
      });
      throw error;
    }
  },

  /**
   * Analyze photo with AI (placeholder for future implementation)
   */
  async analyzePhoto(photoId) {
    try {
      const photo = await Photo.findById(photoId);
      if (!photo) {
        throw new Error("Photo not found");
      }

      // TODO: Implement AI analysis
      // This would integrate with OpenAI or other AI services
      const analysis = {
        confidence: 0.85,
        tags: ["food", "healthy"],
        description: "A healthy meal with vegetables",
        nutrition: {
          estimatedKcal: 350,
          protein: 25,
          carb: 45,
          fat: 12,
        },
        warnings: ["may contain allergens"],
        analyzedAt: new Date(),
      };

      // Update photo with AI analysis
      photo.aiAnalysis = analysis;
      await photo.save();

      // Log event
      await Event.createEvent(
        photo.userId,
        "photo.analyzed",
        "Photo analyzed",
        "AI analysis completed",
        { analysis },
        { userId: photo.userId, photoId: photo._id }
      );

      logger.info("✅ Photo analysis completed", { photoId, analysis });

      return analysis;
    } catch (error) {
      logger.error("❌ Photo analysis failed", {
        error: error.message,
        photoId,
      });
      throw error;
    }
  },

  /**
   * Get photo by ID
   */
  async getPhotoById(photoId, userId = null) {
    try {
      const photo = await Photo.findById(photoId);
      if (!photo) {
        throw new Error("Photo not found");
      }

      // Check privacy
      if (!photo.isPublic && photo.userId.toString() !== userId?.toString()) {
        throw new Error("Access denied");
      }

      return photo;
    } catch (error) {
      logger.error("❌ Get photo failed", {
        error: error.message,
        photoId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get photos by context
   */
  async getPhotosByContext(userId, contextType, contextId, limit = 20) {
    try {
      const photos = await Photo.find({
        userId,
        contextType,
        contextId,
      })
        .sort({ takenAt: -1 })
        .limit(limit);

      return photos;
    } catch (error) {
      logger.error("❌ Get photos by context failed", {
        error: error.message,
        userId,
        contextType,
        contextId,
      });
      throw error;
    }
  },

  /**
   * Get user photos
   */
  async getUserPhotos(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        contextType = null,
        tags = [],
        startDate = null,
        endDate = null,
      } = options;

      const query = { userId };

      if (contextType) query.contextType = contextType;
      if (tags.length > 0) query.tags = { $in: tags };
      if (startDate || endDate) {
        query.takenAt = {};
        if (startDate) query.takenAt.$gte = startDate;
        if (endDate) query.takenAt.$lte = endDate;
      }

      const photos = await Photo.find(query)
        .sort({ takenAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Photo.countDocuments(query);

      return {
        photos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("❌ Get user photos failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Update photo
   */
  async updatePhoto(photoId, userId, updates) {
    try {
      const photo = await Photo.findOne({ _id: photoId, userId });
      if (!photo) {
        throw new Error("Photo not found or access denied");
      }

      // Allowed fields to update
      const allowedUpdates = [
        "tags",
        "description",
        "isPublic",
        "takenAt",
        "location",
      ];

      const filteredUpdates = {};
      allowedUpdates.forEach((field) => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      Object.assign(photo, filteredUpdates);
      await photo.save();

      // Log event
      await Event.createEvent(
        userId,
        "photo.updated",
        "Photo updated",
        "Photo information updated",
        { updates: filteredUpdates },
        { userId, photoId: photo._id }
      );

      logger.info("✅ Photo updated successfully", { photoId, userId });

      return photo;
    } catch (error) {
      logger.error("❌ Photo update failed", {
        error: error.message,
        photoId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Delete photo
   */
  async deletePhoto(photoId, userId) {
    try {
      const photo = await Photo.findOne({ _id: photoId, userId });
      if (!photo) {
        throw new Error("Photo not found or access denied");
      }

      // Delete files
      const sourcePath = path.join(
        multerConfig.uploadPath,
        photo.contextType,
        photo.fileKey
      );
      const thumbnailPath = path.join(
        multerConfig.uploadPath,
        photo.contextType,
        "thumbnails",
        photo.fileKey
      );

      await Promise.all([
        fs.remove(sourcePath).catch(() => {}),
        fs.remove(thumbnailPath).catch(() => {}),
      ]);

      // Delete database record
      await photo.remove();

      // Log event
      await Event.createEvent(
        userId,
        "photo.deleted",
        "Photo deleted",
        "Photo and files deleted",
        { contextType: photo.contextType, contextId: photo.contextId },
        { userId, photoId: photo._id }
      );

      logger.info("✅ Photo deleted successfully", { photoId, userId });

      return { success: true };
    } catch (error) {
      logger.error("❌ Photo deletion failed", {
        error: error.message,
        photoId,
        userId,
      });
      throw error;
    }
  },

  /**
   * Get photo statistics
   */
  async getPhotoStats(userId) {
    try {
      const stats = await Photo.aggregate([
        {
          $match: { userId: new require("mongoose").Types.ObjectId(userId) },
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

      const totalPhotos = await Photo.countDocuments({ userId });
      const totalSize = await Photo.aggregate([
        {
          $match: { userId: new require("mongoose").Types.ObjectId(userId) },
        },
        {
          $group: {
            _id: null,
            totalSize: { $sum: "$size" },
          },
        },
      ]);

      return {
        totalPhotos,
        totalSize: totalSize[0]?.totalSize || 0,
        byContext: stats,
      };
    } catch (error) {
      logger.error("❌ Get photo stats failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  /**
   * Clean up orphaned photos
   */
  async cleanupOrphanedPhotos() {
    try {
      // Find photos without valid context
      const orphanedPhotos = await Photo.find({
        $or: [{ contextId: { $exists: false } }, { contextId: null }],
      });

      let deletedCount = 0;

      for (const photo of orphanedPhotos) {
        try {
          await this.deletePhoto(photo._id, photo.userId);
          deletedCount++;
        } catch (error) {
          logger.warn("⚠️ Failed to delete orphaned photo", {
            photoId: photo._id,
            error: error.message,
          });
        }
      }

      logger.info("✅ Cleanup completed", { deletedCount });

      return { deletedCount };
    } catch (error) {
      logger.error("❌ Photo cleanup failed", { error: error.message });
      throw error;
    }
  },
};

module.exports = photoService;
