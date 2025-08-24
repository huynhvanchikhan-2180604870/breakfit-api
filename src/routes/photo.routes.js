const express = require("express");
const router = express.Router();

// Import controller and middleware
const photoController = require("../controllers/photo.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");
const validationMiddleware = require("../middleware/validation.middleware");
const multerConfig = require("../config/multer.config");

/**
 * Photo routes for image upload and management
 * POST /api/v1/photos - Upload photo
 * GET /api/v1/photos/:photoId - Get photo by ID
 * GET /api/v1/photos - Get user photos
 * PUT /api/v1/photos/:photoId - Update photo
 * DELETE /api/v1/photos/:photoId - Delete photo
 * GET /api/v1/photos/stats - Get photo statistics
 */

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply rate limiting
router.use(rateLimitMiddleware.uploadLimiter);

// Upload photo
router.post(
  "/",
  multerConfig.getMulterInstance("body", 1).single("photo"),
  validationMiddleware.validatePhotoUpload,
  photoController.uploadPhoto
);

// Get photo by ID
router.get("/:photoId", photoController.getPhoto);

// Get user photos
router.get("/", photoController.getUserPhotos);

// Update photo
router.put("/:photoId", photoController.updatePhoto);

// Delete photo
router.delete("/:photoId", photoController.deletePhoto);

// Get photo statistics
router.get("/stats/overview", photoController.getPhotoStats);

module.exports = router;
