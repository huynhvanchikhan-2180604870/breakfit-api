const express = require("express");
const router = express.Router();

// Import controller and middleware
const integrationController = require("../controllers/integration.controller");
const authMiddleware = require("../middleware/auth.middleware");
const rateLimitMiddleware = require("../middleware/rate-limit.middleware");

/**
 * Integration routes for external service connections
 * POST /api/v1/integrations - Create new integration
 * GET /api/v1/integrations - Get user integrations
 * GET /api/v1/integrations/:integrationId - Get integration by ID
 * PUT /api/v1/integrations/:integrationId - Update integration
 * DELETE /api/v1/integrations/:integrationId - Delete integration
 * POST /api/v1/integrations/:integrationId/test - Test integration connection
 * POST /api/v1/integrations/:integrationId/sync - Sync data from integration
 * POST /api/v1/integrations/:integrationId/webhooks - Add webhook to integration
 * DELETE /api/v1/integrations/:integrationId/webhooks/:webhookId - Remove webhook
 * POST /api/v1/integrations/:integrationId/webhooks/trigger - Trigger webhook
 * PUT /api/v1/integrations/:integrationId/credentials - Update integration credentials
 * GET /api/v1/integrations/stats - Get integration statistics
 * GET /api/v1/integrations/errors - Get integrations with errors
 * POST /api/v1/integrations/:integrationId/errors/:errorId/resolve - Resolve integration error
 * GET /api/v1/integrations/types - Get available integration types
 */

// Apply authentication to all routes
router.use(authMiddleware.verifyToken);

// Apply rate limiting for integration endpoints
router.use(rateLimitMiddleware.strictLimiter);

// Create new integration
router.post("/", integrationController.createIntegration);

// Get user integrations
router.get("/", integrationController.getUserIntegrations);

// Get available integration types
router.get("/types", integrationController.getAvailableTypes);

// Get integration statistics
router.get("/stats", integrationController.getIntegrationStats);

// Get integrations with errors
router.get("/errors", integrationController.getIntegrationsWithErrors);

// Integration CRUD operations
router.get("/:integrationId", integrationController.getIntegration);
router.put("/:integrationId", integrationController.updateIntegration);
router.delete("/:integrationId", integrationController.deleteIntegration);

// Test integration connection
router.post("/:integrationId/test", integrationController.testConnection);

// Sync data from integration
router.post("/:integrationId/sync", integrationController.syncData);

// Webhook management
router.post("/:integrationId/webhooks", integrationController.addWebhook);
router.delete(
  "/:integrationId/webhooks/:webhookId",
  integrationController.removeWebhook
);
router.post(
  "/:integrationId/webhooks/trigger",
  integrationController.triggerWebhook
);

// Update integration credentials
router.put(
  "/:integrationId/credentials",
  integrationController.updateCredentials
);

// Resolve integration error
router.post(
  "/:integrationId/errors/:errorId/resolve",
  integrationController.resolveError
);

module.exports = router;
