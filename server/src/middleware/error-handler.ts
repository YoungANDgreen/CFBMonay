import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError && err.isOperational
    ? err.message
    : 'Internal Server Error';

  const response: Record<string, unknown> = {
    success: false,
    error: message,
    statusCode,
  };

  if (config.isDevelopment) {
    response.stack = err.stack;
    // In development, always show the real message
    response.error = err.message;
  }

  console.error(`[Error] ${statusCode} - ${err.message}`);
  if (config.isDevelopment && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json(response);
}
