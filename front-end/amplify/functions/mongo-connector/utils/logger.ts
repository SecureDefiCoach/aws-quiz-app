/**
 * @file logger.ts
 * @description Structured logging module for CloudWatch with JSON format
 * @author AWS Quiz Team
 * @version 1.0.0
 * @date 2025-11-28
 */

export interface Logger {
  logEntry(functionName: string, data?: any): void;
  logExit(functionName: string, data?: any): void;
  logError(functionName: string, error: Error, data?: any): void;
  logInfo(message: string, data?: any): void;
}

/**
 * Creates a logger instance with request tracking
 * 
 * @param requestId - Unique identifier for the request
 * @returns Logger instance with structured logging methods
 * 
 * @example
 * const logger = createLogger(event.requestId);
 * logger.logEntry('startQuiz', { userId: 'user123' });
 */
export function createLogger(requestId: string): Logger {
  const startTime = Date.now();
  
  /**
   * Redacts sensitive data from log output
   */
  const redactSensitiveData = (data: any): any => {
    if (!data) return data;
    
    const redacted = { ...data };
    
    // Redact password fields
    if (redacted.password) redacted.password = '***REDACTED***';
    if (redacted.token) redacted.token = '***REDACTED***';
    if (redacted.apiKey) redacted.apiKey = '***REDACTED***';
    
    // Partially redact email (show first 3 chars)
    if (redacted.email && typeof redacted.email === 'string') {
      redacted.email = redacted.email.substring(0, 3) + '***';
    }
    
    return redacted;
  };
  
  return {
    logEntry(functionName: string, data?: any): void {
      console.log(JSON.stringify({
        level: 'INFO',
        event: 'ENTRY',
        requestId,
        functionName,
        timestamp: new Date().toISOString(),
        data: redactSensitiveData(data)
      }));
    },
    
    logExit(functionName: string, data?: any): void {
      console.log(JSON.stringify({
        level: 'INFO',
        event: 'EXIT',
        requestId,
        functionName,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        data: redactSensitiveData(data)
      }));
    },
    
    logError(functionName: string, error: Error, data?: any): void {
      console.error(JSON.stringify({
        level: 'ERROR',
        event: 'ERROR',
        requestId,
        functionName,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date().toISOString(),
        data: redactSensitiveData(data)
      }));
    },
    
    logInfo(message: string, data?: any): void {
      console.log(JSON.stringify({
        level: 'INFO',
        requestId,
        message,
        timestamp: new Date().toISOString(),
        data: redactSensitiveData(data)
      }));
    }
  };
}
