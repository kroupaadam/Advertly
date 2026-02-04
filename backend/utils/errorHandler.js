/**
 * Centralized Error Handling Utilities
 * Provides consistent error responses and logging
 */

import { logger } from '../config/logger.js';

/**
 * Custom API Error class with status code
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguishes from programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new ApiError(message, 400, code);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(message, 401, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(message, 403, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(message, 404, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(message, 409, code);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new ApiError(message, 429, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(message, 500, code);
  }
}

/**
 * Async route handler wrapper - catches errors and forwards to error middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Format Zod validation errors for API response
 */
export const formatZodError = (zodError) => {
  const errors = {};
  const firstError = zodError.errors[0];

  zodError.errors.forEach((err) => {
    const field = err.path.join('.');
    if (!errors[field]) {
      errors[field] = err.message;
    }
  });

  return {
    success: false,
    message: firstError?.message || 'Validation failed',
    errors,
  };
};

/**
 * Express error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let code = err.code || 'INTERNAL_ERROR';

  // Log error
  if (statusCode >= 500) {
    logger.error({
      err,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    }, 'Server error');
  } else {
    logger.warn({
      statusCode,
      message,
      url: req.url,
      method: req.method,
    }, 'Client error');
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid resource ID';
  }

  if (err.code === 11000) {
    // Mongoose duplicate key error
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate value';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    message: isDevelopment || err.isOperational ? message : 'Something went wrong',
    code,
    ...(isDevelopment && { stack: err.stack }),
  });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};
