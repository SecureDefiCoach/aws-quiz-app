/**
 * @file handler.ts
 * @description Main Lambda handler for quiz GraphQL operations
 * @author AWS Quiz Team
 * @version 1.0.0
 * @date 2025-11-28
 */

import { createLogger } from './utils/logger';
import { handleError } from './utils/errorHandler';
import { getDatabase } from './utils/database';
import {
  getExams,
  getSubDomains,
  getQuestionCount,
  startQuiz,
  getCurrentQuestion,
  submitAnswer,
  markAsMastered,
  setQuestionMark,
} from './services/quizService';

/**
 * AppSync event structure
 */
interface AppSyncEvent {
  info: {
    fieldName: string;
  };
  arguments: any;
  identity?: {
    sub: string;  // Cognito user ID
    username?: string;
  };
  request?: {
    headers?: {
      [key: string]: string;
    };
  };
}

/**
 * Main Lambda handler for AppSync GraphQL operations
 * Routes requests to appropriate service functions based on fieldName
 * 
 * @param event - AppSync event with query/mutation details
 * @returns Result from the appropriate service function
 */
export const handler = async (event: any): Promise<any> => {
  // Log the entire event to see what we're receiving
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const requestId = event.request?.headers?.['x-amzn-requestid'] || event.requestId || 'unknown';
  const logger = createLogger(requestId);
  
  // Handle different event structures
  const fieldName = event.info?.fieldName || event.fieldName || 'unknown';
  const args = event.arguments || event.args || {};
  const userId = event.identity?.sub || event.identity?.claims?.sub || 'unknown';
  
  logger.logEntry('quiz-resolver', { 
    fieldName,
    hasIdentity: !!userId,
    eventKeys: Object.keys(event)
  });
  
  try {
    if (!userId || userId === 'unknown') {
      throw new Error('User not authenticated');
    }
    
    // Get database connection
    const db = await getDatabase(logger);
    
    let result: any;
    
    switch (fieldName) {
      case 'getExams':
        result = await getExams(db, logger);
        break;
        
      case 'getSubDomains':
        result = await getSubDomains(db, args.examNumber, logger);
        break;
        
      case 'getQuestionCount':
        result = await getQuestionCount(db, userId, {
          examNumber: args.examNumber,
          subDomain: args.subDomain,
          states: args.states
        }, logger);
        break;
        
      case 'startQuiz':
        result = await startQuiz(db, userId, {
          examNumber: args.examNumber,
          examName: args.examName,
          subDomain: args.subDomain,
          states: args.states,
          maxQuestions: args.maxQuestions
        }, logger);
        break;
        
      case 'getCurrentQuestion':
        result = await getCurrentQuestion(db, userId, args.sessionId, logger);
        break;
        
      case 'submitAnswer':
        result = await submitAnswer(db, userId, {
          sessionId: args.sessionId,
          questionId: args.questionId,
          selectedLetters: args.selectedLetters
        }, logger);
        break;
        
      case 'markAsMastered':
        result = await markAsMastered(db, userId, args.questionId, logger);
        break;
      
      case 'setQuestionMark':
        result = await setQuestionMark(db, userId, args.questionId, args.markType, logger);
        break;
        
      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
    
    logger.logExit('quiz-resolver', { fieldName });
    return result;
    
  } catch (error) {
    handleError(error, logger);
  }
};