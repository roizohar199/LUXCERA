/**
 * Centralized Error Handling
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    const errorMessage = firstError?.message || 'Validation error';
    logger.warn('Validation error', { errors: err.errors, path: req.path });
    return res.status(400).json({
      ok: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.errors : undefined,
    });
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    logger.error('Application error', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      path: req.path,
    });
    
    return res.status(err.statusCode).json({
      ok: false,
      error: err.message,
    });
  }

  // Handle CSRF errors
  if (err.name === 'EBADCSRFTOKEN' || err.name === 'CSRFTokenError') {
    logger.warn('CSRF token error', { path: req.path });
    return res.status(403).json({
      ok: false,
      error: 'Invalid CSRF token',
    });
  }

  // Handle unknown errors
  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const isProduction = process.env.NODE_ENV === 'production';
  
  return res.status(500).json({
    ok: false,
    error: isProduction 
      ? 'Internal server error' 
      : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

/**
 * Async handler wrapper to catch errors in async routes
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
