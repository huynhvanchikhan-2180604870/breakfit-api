const winston = require("winston");
const path = require("path");

/**
 * Modern logger utility using Winston
 * Supports console and file logging with custom formatting
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "breakfit-api" },
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : "";
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),

    // File transport for errors
    new winston.transports.File({
      filename: path.join("src/logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join("src/logs", "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add custom methods for better logging
const customLogger = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Custom methods for specific contexts
  api: (message, meta = {}) => logger.info(`🌐 API: ${message}`, meta),
  db: (message, meta = {}) => logger.info(`🗄️ DB: ${message}`, meta),
  ws: (message, meta = {}) => logger.info(`🔌 WS: ${message}`, meta),
  auth: (message, meta = {}) => logger.info(`�� AUTH: ${message}`, meta),
  upload: (message, meta = {}) => logger.info(`�� UPLOAD: ${message}`, meta),
};

module.exports = customLogger;
