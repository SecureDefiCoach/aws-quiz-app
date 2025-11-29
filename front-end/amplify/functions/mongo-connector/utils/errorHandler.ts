/**
 * @file errorHandler.ts
 * @description Centralized error handling with structured responses
 * @author AWS Quiz Team
 * @version 1.0.0
 * @date 2025-11-28
 */

import { AppError } from '../errors/AppError';
import { Logger } from './logger';

/**
 * Handles errors and formats them for GraphQL responses
 * 
 * @param error - The error to handle
 * @param logger - Logger instance for error logging
 * @throws Formatted error for GraphQL client
 * 
 * @example
 * try {
 *   // operation
 * } catch (error) {
 *   handleError(error, logger);
 * }
 */
export function handleError(error: unknown, logger: Logger): never {
  if (error instanceof AppError) {
    logger.logError('AppError', error, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    });
    
    throw new Error(JSON.stringify({
      errorType: error.code,
      errorMessage: error.message,
      statusCode: error.statusCode
    }));
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    logger.logError('UnknownError', error);
    throw new Error(JSON.stringify({
      errorType: 'INTERNAL_ERROR',
      errorMessage: 'An unexpected error occurred',
      statusCode: 500
    }));
  }
  
  // Handle non-Error objects
  logger.logInfo('Unknown error type', { error });
  throw new Error(JSON.stringify({
    errorType: 'INTERNAL_ERROR',
    errorMessage: 'An unexpected error occurred',
    statusCode: 500
  }));
}
