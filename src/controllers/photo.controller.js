const photoService = require("../services/photo.service");
const logger = require("../utils/logger.util");

/**
 * Photo controller for image upload and management
 * Handles photo uploads, processing, and analysis
 */
const photoController = {
  /**
   * Upload photo
   */
  async uploadPhoto(req, res) {
    try {
      const userId = req.user._id;
      const { contextType, contextId, description, isPublic, tags } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "File ảnh là bắt buộc",
        });
      }

      if (!contextType || !contextId) {
        return res.status(400).json({
          success: false,
          message: "Loại ngữ cảnh và ID ngữ cảnh là bắt buộc",
          errors: {
            contextType: !contextType ? "Loại ngữ cảnh là bắt buộc" : null,
            contextId: !contextId ? "ID ngữ cảnh là bắt buộc" : null,
          },
        });
      }

      // Validate context type
      const validContextTypes = ["meal", "workout", "progress", "profile"];
      if (!validContextTypes.includes(contextType)) {
        return res.status(400).json({
          success: false,
          message: "Loại ngữ cảnh không hợp lệ",
        });
      }

      // Upload photo
      const photo = await photoService.uploadPhoto(
        userId,
        file,
        contextType,
        contextId,
        {
          description,
          isPublic: isPublic === "true",
          tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        }
      );

      logger.info("✅ Photo uploaded successfully", {
        userId,
        photoId: photo._id,
        contextType,
        contextId,
        fileSize: file.size,
      });

      res.status(201).json({
        success: true,
        message: "Ảnh đã được tải lên thành công",
        data: { photo },
      });
    } catch (error) {
      logger.error("❌ Photo upload failed", {
        error: error.message,
        userId: req.user?._id,
      });

      if (error.message === "Invalid file type") {
        return res.status(400).json({
          success: false,
          message:
            "Loại file không được hỗ trợ. Chỉ chấp nhận ảnh JPG, PNG, WebP",
        });
      }

      if (error.message === "File too large") {
        return res.status(400).json({
          success: false,
          message: "File quá lớn. Kích thước tối đa là 5MB",
        });
      }

      res.status(500).json({
        success: false,
        message: "Tải ảnh lên thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get photo by ID
   */
  async getPhoto(req, res) {
    try {
      const userId = req.user._id;
      const { photoId } = req.params;

      // Get photo
      const photo = await photoService.getPhotoById(photoId, userId);

      logger.info("✅ Photo retrieved", {
        userId,
        photoId,
      });

      res.json({
        success: true,
        message: "Ảnh đã được lấy thành công",
        data: { photo },
      });
    } catch (error) {
      logger.error("❌ Get photo failed", {
        error: error.message,
        userId: req.user?._id,
        photoId: req.params.photoId,
      });

      if (error.message === "Photo not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy ảnh",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem ảnh này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy ảnh thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user photos
   */
  async getUserPhotos(req, res) {
    try {
      const userId = req.user._id;
      const { contextType, limit = 20, page = 1 } = req.query;

      // Get user photos
      const result = await photoService.getUserPhotos(userId, {
        contextType,
        limit: parseInt(limit),
        page: parseInt(page),
      });

      logger.info("✅ User photos retrieved", {
        userId,
        count: result.photos.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách ảnh đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get user photos failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách ảnh thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update photo
   */
  async updatePhoto(req, res) {
    try {
      const userId = req.user._id;
      const { photoId } = req.params;
      const updates = req.body;

      // Update photo
      const photo = await photoService.updatePhoto(photoId, userId, updates);

      logger.info("✅ Photo updated", {
        userId,
        photoId,
        updates: Object.keys(updates),
      });

      res.json({
        success: true,
        message: "Ảnh đã được cập nhật thành công",
        data: { photo },
      });
    } catch (error) {
      logger.error("❌ Update photo failed", {
        error: error.message,
        userId: req.user?._id,
        photoId: req.params.photoId,
      });

      if (error.message === "Photo not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy ảnh",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa ảnh này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật ảnh thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Delete photo
   */
  async deletePhoto(req, res) {
    try {
      const userId = req.user._id;
      const { photoId } = req.params;

      // Delete photo
      await photoService.deletePhoto(photoId, userId);

      logger.info("✅ Photo deleted", {
        userId,
        photoId,
      });

      res.json({
        success: true,
        message: "Ảnh đã được xóa thành công",
      });
    } catch (error) {
      logger.error("❌ Delete photo failed", {
        error: error.message,
        userId: req.user?._id,
        photoId: req.params.photoId,
      });

      if (error.message === "Photo not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy ảnh",
        });
      }

      if (error.message === "Unauthorized access") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa ảnh này",
        });
      }

      res.status(500).json({
        success: false,
        message: "Xóa ảnh thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get photo statistics
   */
  async getPhotoStats(req, res) {
    try {
      const userId = req.user._id;

      // Get photo statistics
      const stats = await photoService.getPhotoStatistics(userId);

      logger.info("✅ Photo statistics retrieved", {
        userId,
        totalPhotos: stats.totalPhotos,
        totalSize: stats.totalSize,
      });

      res.json({
        success: true,
        message: "Thống kê ảnh đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get photo statistics failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thống kê ảnh thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = photoController;
