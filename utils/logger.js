// utils/logger.js - Configures Winston for structured logging

const winston = require('winston');
require('winston-daily-rotate-file'); // Tool for creating daily log files

// Define the structured JSON format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Ensures error stack traces are captured
  winston.format.json() // Logs will be in easy-to-read JSON format
);

// Create the logger instance
const logger = winston.createLogger({
  level: 'info', // Default minimum log level
  format: logFormat,
  transports: [
    // 1. Daily File Transport (for historical records and troubleshooting)
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error', // Only capture 'error' messages here
      maxFiles: '14d', // Keep 14 days of error history
      auditFile: 'logs/.audit/error-audit.json' // Helps manage log rotation
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      level: 'info', // Capture all 'info' and above messages here
      maxFiles: '30d', // Keep 30 days of general application logs
      auditFile: 'logs/.audit/app-audit.json'
    }),
  ]
});

// 2. Console Transport (for immediate feedback during development)
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

/**
 * Custom function to log actions, replacing the Sheets logAction.
 * @param {string} functionName - The function or module where the action occurred.
 * @param {string} action - A brief description of the action.
 * @param {Object} [metadata={}] - Key-value pairs for context (e.g., quizId, rowNum).
 */
const logAction = (functionName, action, metadata = {}) => {
    logger.info({
        message: action,
        service: functionName,
        ...metadata // Custom variables (like rowNum, quizId, etc.)
    });
};

module.exports = { logger, logAction };