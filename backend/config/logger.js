import pino from 'pino';

/**
 * Centralized Logger Configuration
 * Using Pino for high-performance JSON logging
 * 
 * In development: Pretty-printed, colorful logs
 * In production: JSON format for log aggregation (CloudWatch, Datadog, etc.)
 */

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Base configuration
const baseConfig = {
  level: logLevel,
  // Add timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
  // Base context for all logs
  base: {
    service: 'advertly-backend',
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'req.headers.authorization',
      'req.body.password',
      'req.body.confirmPassword',
      'req.body.currentPassword',
      'req.body.newPassword',
    ],
    censor: '[REDACTED]',
  },
};

// Development: pretty printing
const devConfig = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname,service,env',
      singleLine: false,
    },
  },
};

// Production: JSON output
const prodConfig = baseConfig;

// Create logger instance
export const logger = pino(isProduction ? prodConfig : devConfig);

// Create child loggers for specific modules
export const createLogger = (module) => logger.child({ module });

// Pre-configured module loggers
export const authLogger = createLogger('auth');
export const aiLogger = createLogger('ai');
export const dbLogger = createLogger('database');
export const httpLogger = createLogger('http');

/**
 * Express request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  httpLogger.info({
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  }, 'Incoming request');
  
  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };
    
    if (res.statusCode >= 400) {
      httpLogger.warn(logData, 'Request completed with error');
    } else {
      httpLogger.info(logData, 'Request completed');
    }
  });
  
  next();
};

export default logger;
