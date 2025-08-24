const integrationService = require("../services/integration.service");
const logger = require("../utils/logger.util");

/**
 * Integration controller for external service connections
 * Handles API integrations, webhooks, and data synchronization
 */
const integrationController = {
  /**
   * Create new integration
   */
  async createIntegration(req, res) {
    try {
      const userId = req.user._id;
      const integrationData = req.body;

      // Validate required fields
      if (!integrationData.type || !integrationData.provider) {
        return res.status(400).json({
          success: false,
          message: "Loại và nhà cung cấp integration là bắt buộc",
        });
      }

      const integration = await integrationService.createIntegration(
        userId,
        integrationData
      );

      logger.info("✅ Integration created successfully", {
        userId,
        integrationId: integration._id,
        type: integration.type,
        provider: integration.provider,
      });

      res.status(201).json({
        success: true,
        message: "Integration đã được tạo thành công",
        data: { integration },
      });
    } catch (error) {
      logger.error("❌ Create integration failed", {
        error: error.message,
        userId: req.user?._id,
        integrationData: req.body,
      });

      if (error.message.includes("already exists")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Tạo integration thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get user integrations
   */
  async getUserIntegrations(req, res) {
    try {
      const userId = req.user._id;
      const { type, status, limit = 50, page = 1 } = req.query;

      const options = {
        type,
        status,
        limit: parseInt(limit),
        page: parseInt(page),
      };

      const result = await integrationService.getUserIntegrations(
        userId,
        options
      );

      logger.info("✅ User integrations retrieved successfully", {
        userId,
        count: result.integrations.length,
        total: result.pagination.total,
      });

      res.json({
        success: true,
        message: "Danh sách integrations đã được lấy thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Get user integrations failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: "Lấy danh sách integrations thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get integration by ID
   */
  async getIntegration(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId } = req.params;

      if (!integrationId) {
        return res.status(400).json({
          success: false,
          message: "Integration ID là bắt buộc",
        });
      }

      const integration = await integrationService.getIntegrationById(
        integrationId,
        userId
      );

      logger.info("✅ Integration retrieved successfully", {
        userId,
        integrationId,
      });

      res.json({
        success: true,
        message: "Thông tin integration đã được lấy thành công",
        data: { integration },
      });
    } catch (error) {
      logger.error("❌ Get integration failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Lấy thông tin integration thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update integration
   */
  async updateIntegration(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId } = req.params;
      const updateData = req.body;

      if (!integrationId) {
        return res.status(400).json({
          success: false,
          message: "Integration ID là bắt buộc",
        });
      }

      const integration = await integrationService.updateIntegration(
        integrationId,
        userId,
        updateData
      );

      logger.info("✅ Integration updated successfully", {
        userId,
        integrationId,
        updatedFields: Object.keys(updateData),
      });

      res.json({
        success: true,
        message: "Integration đã được cập nhật thành công",
        data: { integration },
      });
    } catch (error) {
      logger.error("❌ Update integration failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
        updateData: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật integration thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Delete integration
   */
  async deleteIntegration(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId } = req.params;

      if (!integrationId) {
        return res.status(400).json({
          success: false,
          message: "Integration ID là bắt buộc",
        });
      }

      const result = await integrationService.deleteIntegration(
        integrationId,
        userId
      );

      logger.info("✅ Integration deleted successfully", {
        userId,
        integrationId,
      });

      res.json({
        success: true,
        message: "Integration đã được xóa thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Delete integration failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Xóa integration thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Test integration connection
   */
  async testConnection(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId } = req.params;

      if (!integrationId) {
        return res.status(400).json({
          success: false,
          message: "Integration ID là bắt buộc",
        });
      }

      const result = await integrationService.testConnection(
        integrationId,
        userId
      );

      logger.info("✅ Integration connection tested successfully", {
        userId,
        integrationId,
        result,
      });

      res.json({
        success: true,
        message: "Kiểm tra kết nối integration thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Test integration connection failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Kiểm tra kết nối integration thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Sync data from integration
   */
  async syncData(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId } = req.params;
      const { dataType } = req.body;

      if (!integrationId) {
        return res.status(400).json({
          success: false,
          message: "Integration ID là bắt buộc",
        });
      }

      const result = await integrationService.syncData(
        integrationId,
        userId,
        dataType
      );

      logger.info("✅ Integration data synced successfully", {
        userId,
        integrationId,
        dataType,
        recordsProcessed: result.recordsProcessed,
      });

      res.json({
        success: true,
        message: "Đồng bộ dữ liệu integration thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Sync integration data failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
        dataType: req.body.dataType,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("not active")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Đồng bộ dữ liệu integration thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Trigger webhook
   */
  async triggerWebhook(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId } = req.params;
      const { event, data } = req.body;

      if (!integrationId || !event) {
        return res.status(400).json({
          success: false,
          message: "Integration ID và event là bắt buộc",
        });
      }

      const results = await integrationService.triggerWebhook(
        integrationId,
        userId,
        event,
        data
      );

      logger.info("✅ Webhook triggered successfully", {
        userId,
        integrationId,
        event,
        resultsCount: results.length,
      });

      res.json({
        success: true,
        message: "Webhook đã được kích hoạt thành công",
        data: { results },
      });
    } catch (error) {
      logger.error("❌ Trigger webhook failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
        event: req.body.event,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Kích hoạt webhook thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Add webhook to integration
   */
  async addWebhook(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId } = req.params;
      const webhookData = req.body;

      if (!integrationId || !webhookData.event || !webhookData.url) {
        return res.status(400).json({
          success: false,
          message: "Integration ID, event và URL là bắt buộc",
        });
      }

      const webhook = await integrationService.addWebhook(
        integrationId,
        userId,
        webhookData
      );

      logger.info("✅ Webhook added successfully", {
        userId,
        integrationId,
        webhookId: webhook._id,
        event: webhook.event,
      });

      res.json({
        success: true,
        message: "Webhook đã được thêm thành công",
        data: { webhook },
      });
    } catch (error) {
      logger.error("❌ Add webhook failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
        webhookData: req.body,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Thêm webhook thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Remove webhook from integration
   */
  async removeWebhook(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId, webhookId } = req.params;

      if (!integrationId || !webhookId) {
        return res.status(400).json({
          success: false,
          message: "Integration ID và Webhook ID là bắt buộc",
        });
      }

      const result = await integrationService.removeWebhook(
        integrationId,
        userId,
        webhookId
      );

      logger.info("✅ Webhook removed successfully", {
        userId,
        integrationId,
        webhookId,
      });

      res.json({
        success: true,
        message: "Webhook đã được xóa thành công",
        data: result,
      });
    } catch (error) {
      logger.error("❌ Remove webhook failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
        webhookId: req.params.webhookId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Xóa webhook thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Update integration credentials
   */
  async updateCredentials(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId } = req.params;
      const credentials = req.body;

      // ... existing code từ dòng 1-570 ...

      if (!integrationId || !credentials) {
        return res.status(400).json({
          success: false,
          message: "Integration ID và credentials là bắt buộc",
        });
      }

      const integration = await integrationService.updateCredentials(
        integrationId,
        userId,
        credentials
      );

      logger.info("✅ Integration credentials updated successfully", {
        userId,
        integrationId,
        updatedFields: Object.keys(credentials),
      });

      res.json({
        success: true,
        message: "Credentials của integration đã được cập nhật thành công",
        data: { integration },
      });
    } catch (error) {
      logger.error("❌ Update integration credentials failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Cập nhật credentials thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get integration statistics
   */
  async getIntegrationStats(req, res) {
    try {
      const userId = req.user._id;

      const stats = await integrationService.getIntegrationStats(userId);

      logger.info("✅ Integration statistics retrieved successfully", {
        userId,
        totalIntegrations: stats.total,
      });

      res.json({
        success: true,
        message: "Thống kê integrations đã được lấy thành công",
        data: { stats },
      });
    } catch (error) {
      logger.error("❌ Get integration statistics failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "Lấy thống kê integrations thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get integrations with errors
   */
  async getIntegrationsWithErrors(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 10 } = req.query;

      const integrations = await integrationService.getIntegrationsWithErrors(
        userId,
        parseInt(limit)
      );

      logger.info("✅ Integrations with errors retrieved successfully", {
        userId,
        count: integrations.length,
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        message: "Danh sách integrations có lỗi đã được lấy thành công",
        data: { integrations },
      });
    } catch (error) {
      logger.error("❌ Get integrations with errors failed", {
        error: error.message,
        userId: req.user?._id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message:
          "Lấy danh sách integrations có lỗi thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Resolve integration error
   */
  async resolveError(req, res) {
    try {
      const userId = req.user._id;
      const { integrationId, errorId } = req.params;

      if (!integrationId || !errorId) {
        return res.status(400).json({
          success: false,
          message: "Integration ID và Error ID là bắt buộc",
        });
      }

      const error = await integrationService.resolveError(
        integrationId,
        userId,
        errorId,
        userId
      );

      logger.info("✅ Integration error resolved successfully", {
        userId,
        integrationId,
        errorId,
      });

      res.json({
        success: true,
        message: "Lỗi integration đã được giải quyết thành công",
        data: { error },
      });
    } catch (error) {
      logger.error("❌ Resolve integration error failed", {
        error: error.message,
        userId: req.user?._id,
        integrationId: req.params.integrationId,
        errorId: req.params.errorId,
      });

      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Giải quyết lỗi integration thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * Get available integration types
   */
  async getAvailableTypes(req, res) {
    try {
      const types = await integrationService.getAvailableTypes();

      logger.info("✅ Available integration types retrieved successfully", {
        userId: req.user?._id,
        count: types.length,
      });

      res.json({
        success: true,
        message: "Danh sách loại integrations đã được lấy thành công",
        data: { types },
      });
    } catch (error) {
      logger.error("❌ Get available integration types failed", {
        error: error.message,
        userId: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message:
          "Lấy danh sách loại integrations thất bại. Vui lòng thử lại sau",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};

module.exports = integrationController;