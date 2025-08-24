const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('../utils/logger.util');

/**
 * Basic middleware setup for security and logging
 * Modern ES7+ style with arrow functions
 */
const basicMiddleware = {
  /**
   * CORS configuration
   */
  cors: cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key']
  }),

  /**
   * Security headers with Helmet
   */
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"]
      }
    },
    crossOriginEmbedderPolicy: false
  }),

  /**
   * HTTP request logging with Morgan
   */
  morgan: morgan((tokens, req, res) => {
    const logData = {
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseTime: tokens['response-time'](req, res),
      userAgent: tokens['user-agent'](req, res),
      ip: req.ip || req.connection.remoteAddress
    };

    // Log based on status code
    if (res.statusCode >= 400) {
      logger.error('❌ HTTP Error Request', logData);
    } else {
      logger.info('✅ HTTP Request', logData);
    }

    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens['response-time'](req, res), 'ms'
    ].join(' ');
  }),

  /**
   * Request body parsing
   */
  bodyParser: {
    json: { limit: '10mb' },
    urlencoded: { extended: true, limit: '10mb' }
  },

  /**
   * Static file serving for uploads
   */
  static: {
    directory: 'src/uploads',
    prefix: '/uploads'
  }
};

module.exports = basicMiddleware;
