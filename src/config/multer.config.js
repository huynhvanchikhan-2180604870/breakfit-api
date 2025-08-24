const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const logger = require("../utils/logger.util");

/**
 * Multer configuration for file uploads
 * Modern ES7+ style with arrow functions and async/await
 */
const multerConfig = {
  uploadPath: process.env.UPLOAD_PATH || "./src/uploads",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  allowedImageTypes: (
    process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/webp"
  ).split(","),

  /**
   * Ensure upload directories exist
   */
  async ensureUploadDirectories() {
    try {
      const directories = [
        this.uploadPath,
        path.join(this.uploadPath, "meals"),
        path.join(this.uploadPath, "workouts"),
        path.join(this.uploadPath, "body"),
      ];

      // Use Promise.all for parallel execution
      await Promise.all(directories.map((dir) => fs.ensureDir(dir)));

      logger.info("✅ Upload directories đã được tạo", {
        basePath: this.uploadPath,
        directories,
      });
    } catch (error) {
      logger.error("❌ Lỗi tạo upload directories:", error);
    }
  },

  /**
   * Configure storage for different contexts
   */
  getStorageConfig(context) {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const contextPath = path.join(this.uploadPath, context);
        cb(null, contextPath);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const userId = req.user?._id || "anonymous";
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        const filename = `${timestamp}_${userId}_${originalName}`;

        cb(null, filename);
      },
    });
  },

  /**
   * File filter for image validation
   */
  fileFilter(req, file, cb) {
    // Check file type
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      const error = new Error(
        `Loại file không được hỗ trợ. Chỉ chấp nhận: ${this.allowedImageTypes.join(
          ", "
        )}`
      );
      error.code = "UNSUPPORTED_FILE_TYPE";
      return cb(error, false);
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      const error = new Error(
        `File quá lớn. Kích thước tối đa: ${this.maxFileSize / (1024 * 1024)}MB`
      );
      error.code = "FILE_TOO_LARGE";
      return cb(error, false);
    }

    cb(null, true);
  },

  /**
   * Get multer instance for specific context
   */
  getMulterInstance(context, maxFiles = 5) {
    return multer({
      storage: this.getStorageConfig(context),
      fileFilter: this.fileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize,
        files: maxFiles,
      },
    });
  },

  /**
   * Get multer instances for different contexts
   */
  getMulterInstances() {
    return {
      meals: this.getMulterInstance("meals", 3),
      workouts: this.getMulterInstance("workouts", 3),
      body: this.getMulterInstance("body", 1),
      profile: this.getMulterInstance("body", 1),
    };
  },

  /**
   * Clean up old files
   */
  async removeFile(filePath) {
    try {
      if (filePath && (await fs.pathExists(filePath))) {
        await fs.remove(filePath);
        logger.info("🗑️ Đã xóa file:", filePath);
      }
    } catch (error) {
      logger.error("❌ Lỗi xóa file:", error);
    }
  },

  /**
   * Get file info
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      logger.error("❌ Lỗi lấy thông tin file:", error);
      return null;
    }
  },

  /**
   * Get upload configuration
   */
  getConfig() {
    return {
      uploadPath: this.uploadPath,
      maxFileSize: this.maxFileSize,
      allowedImageTypes: this.allowedImageTypes,
      maxFiles: {
        meals: 3,
        workouts: 3,
        body: 1,
        profile: 1,
      },
    };
  },
};

// Initialize upload directories
multerConfig.ensureUploadDirectories();

module.exports = multerConfig;
