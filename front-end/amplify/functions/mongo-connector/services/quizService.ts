/**
 * @file quizService.ts
 * @description Core business logic for quiz session management
 * @author AWS Quiz Team
 * @version 1.0.0
 * @date 2025-11-28
 */

import { Db, ObjectId } from 'mongodb';
import { Logger } from '../utils/logger';
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors/AppError';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Exam {
  number: string;
  name: string;
  display: string;
}

export interface SubDomain {
  num: number;
  name: string;
}

export interface QuestionFilters {
  examNumber: string;
  subDomain?: string;
  states: string[];
}

export interface QuizFilters extends QuestionFilters {
  examName: string;
  maxQuestions?: number;
}

export interface QuizSession {
  sessionId: string;
  total: number;
  examNumber: string;
  examName: string;
  subDomain: string;
}

export interface QuestionData {
  questionNumber: number;
  total: number;
  question: string;
  options: QuestionOption[];
  isMulti: boolean;
  questionType: number;
  rowNum: number;
  subDomain: string;
  countRight: number;
  countWrong: number;
  sessionCorrect: number;
  sessionWrong: number;
  originalNumber: string;
  markType: number;
}

export interface QuestionOption {
  letter: string;
  text: string;
}

export interface AnswerSubmission {
  sessionId: string;
  questionId: string;
  selectedLetters: string[];
}

export interface AnswerFeedback {
  isCorrect: boolean;
  correctLetters: string[];
  selectedLetters: string[];
  explanation: string;
  countRight: number;
  countWrong: number;
  isComplete: boolean;
  summary?: QuizSummary;
}

export interface QuizSummary {
  correct: number;
  total: number;
  percentage: number;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Gets all available exams from the question bank
 * 
 * @param db - MongoDB database instance
 * @param logger - Logger instance
 * @returns Array of unique exams sorted alphabetically
 * 
 * @example
 * const exams = await getExams(db, logger);
 * // [{ number: 'SCS-C02', name: 'AWS Certified Security', display: 'SCS-C02 - AWS Certified Security' }]
 */
export async function getExams(db: Db, logger: Logger): Promise<Exam[]> {
  logger.logEntry('getExams');
  
  try {
    const questions = db.collection('questions');
    
    // Get unique exam numbers and names
    const exams = await questions.aggregate([
      {
        $group: {
          _id: '$examNumber',
          name: { $first: '$examName' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    const result = exams.map(exam => ({
      number: exam._id,
      name: exam.name || exam._id,
      display: `${exam._id} - ${exam.name || exam._id}`
    }));
    
    logger.logExit('getExams', { count: result.length });
    return result;
    
  } catch (error) {
    logger.logError('getExams', error as Error);
    throw error;
  }
}

/**
 * Gets subdomains for a specific exam
 * 
 * @param db - MongoDB database instance
 * @param examNumber - Exam identifier (e.g., 'SCS-C02')
 * @param logger - Logger instance
 * @returns Array of subdomains sorted by number
 * 
 * @example
 * const subdomains = await getSubDomains(db, 'SCS-C02', logger);
 * // [{ num: 1.1, name: 'Identity & Access Management' }]
 */
export async function getSubDomains(
  db: Db,
  examNumber: string,
  logger: Logger
): Promise<SubDomain[]> {
  logger.logEntry('getSubDomains', { examNumber });
  
  try {
    const questions = db.collection('questions');
    
    // Get unique subdomains for the exam
    const subdomains = await questions.aggregate([
      { $match: { examNumber } },
      {
        $group: {
          _id: '$subDomainNum',
          name: { $first: '$subDomain' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    const result = subdomains.map(sd => ({
      num: parseFloat(sd._id),
      name: sd.name
    }));
    
    logger.logExit('getSubDomains', { count: result.length });
    return result;
    
  } catch (error) {
    logger.logError('getSubDomains', error as Error);
    throw error;
  }
}

/**
 * Counts questions matching filters, excluding mastered questions
 * 
 * @param db - MongoDB database instance
 * @param userId - Cognito user ID
 * @param filters - Question filters
 * @param logger - Logger instance
 * @returns Count of matching questions
 */
export async function getQuestionCount(
  db: Db,
  userId: string,
  filters: QuestionFilters,
  logger: Logger
): Promise<number> {
  logger.logEntry('getQuestionCount', { userId, filters });
  
  try {
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Build match criteria
    const matchCriteria: any = { examNumber: filters.examNumber };
    if (filters.subDomain) {
      matchCriteria.subDomainNum = filters.subDomain;
    }
    
    // Get mastered question IDs for this user
    const masteredQuestions = await userProgress.find({
      userId,
      state: 'MASTERED'
    }).toArray();
    
    const masteredIds = masteredQuestions.map(p => new ObjectId(p.questionId));
    
    // Exclude mastered questions
    if (masteredIds.length > 0) {
      matchCriteria._id = { $nin: masteredIds };
    }
    
    // Get user progress for state filtering
    const progressMap = new Map();
    const userProgressDocs = await userProgress.find({ userId }).toArray();
    userProgressDocs.forEach(p => {
      progressMap.set(p.questionId.toString(), p);
    });
    
    // Fetch all matching questions
    const allQuestions = await questions.find(matchCriteria).toArray();
    
    // Filter by state
    const filteredQuestions = allQuestions.filter(q => {
      const qId = q._id.toString();
      const progress = progressMap.get(qId);
      
      if (!progress) {
        // No progress = NEW
        return filters.states.includes('NEW');
      }
      
      // Check for EVER_WRONG filter
      if (filters.states.includes('EVER_WRONG') && progress.wrongCount > 0) {
        return true;
      }
      
      // Check for regular state filters
      return filters.states.includes(progress.state);
    });
    
    const count = filteredQuestions.length;
    
    logger.logExit('getQuestionCount', { count });
    return count;
    
  } catch (error) {
    logger.logError('getQuestionCount', error as Error);
    throw error;
  }
}

/**
 * Fisher-Yates shuffle algorithm for random array ordering
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Starts a new quiz session with filtered and randomized questions
 * 
 * @param db - MongoDB database instance
 * @param userId - Cognito user ID
 * @param filters - Quiz filters
 * @param logger - Logger instance
 * @returns Quiz session metadata
 * @throws {ValidationError} If filters are invalid
 * @throws {NotFoundError} If no questions match filters
 * 
 * @example
 * const session = await startQuiz(db, 'user123', {
 *   examNumber: 'SCS-C02',
 *   examName: 'AWS Security',
 *   states: ['NEW', 'WRONG'],
 *   maxQuestions: 10
 * }, logger);
 */
export async function startQuiz(
  db: Db,
  userId: string,
  filters: QuizFilters,
  logger: Logger
): Promise<QuizSession> {
  logger.logEntry('startQuiz', { userId, filters });
  
  // Enhanced debug logging for Ever Wrong filter issue
  console.log('🔍 DEBUG startQuiz:', {
    userId,
    examNumber: filters.examNumber,
    states: filters.states,
    subDomain: filters.subDomain,
    maxQuestions: filters.maxQuestions
  });
  
  try {
    // Validate filters
    if (!filters.examNumber || !filters.examName) {
      throw new ValidationError('examNumber and examName are required');
    }
    
    if (!filters.states || filters.states.length === 0) {
      throw new ValidationError('At least one state filter is required');
    }
    
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    const quizSessions = db.collection('quizSessions');
    
    // Build match criteria
    const matchCriteria: any = { examNumber: filters.examNumber };
    if (filters.subDomain) {
      matchCriteria.subDomainNum = filters.subDomain;
    }
    
    // Get mastered question IDs to exclude
    const masteredQuestions = await userProgress.find({
      userId,
      state: 'MASTERED'
    }).toArray();
    
    const masteredIds = masteredQuestions.map(p => new ObjectId(p.questionId));
    if (masteredIds.length > 0) {
      matchCriteria._id = { $nin: masteredIds };
    }
    
    // Get user progress for state filtering
    const progressMap = new Map();
    const userProgressDocs = await userProgress.find({ userId }).toArray();
    userProgressDocs.forEach(p => {
      progressMap.set(p.questionId.toString(), p);
    });
    
    // Fetch all matching questions
    const allQuestions = await questions.find(matchCriteria).toArray();
    
    // Filter by state
    const filteredQuestions = allQuestions.filter(q => {
      const qId = q._id.toString();
      const progress = progressMap.get(qId);
      
      if (!progress) {
        // No progress = NEW
        return filters.states.includes('NEW');
      }
      
      // Check for EVER_WRONG filter
      if (filters.states.includes('EVER_WRONG') && progress.wrongCount > 0) {
        return true;
      }
      
      // Check for regular state filters
      return filters.states.includes(progress.state);
    });
    
    // Enhanced debug logging for Ever Wrong filter issue
    console.log('🔍 DEBUG filter results:', {
      userId,
      examNumber: filters.examNumber,
      totalQuestions: allQuestions.length,
      filteredQuestions: filteredQuestions.length,
      progressRecords: userProgressDocs.length,
      everWrongCount: userProgressDocs.filter(p => p.wrongCount > 0).length,
      states: filters.states
    });
    
    if (filteredQuestions.length === 0) {
      console.log('🔍 DEBUG no questions found:', {
        userId,
        examNumber: filters.examNumber,
        states: filters.states,
        subDomain: filters.subDomain,
        totalProgressRecords: userProgressDocs.length,
        progressSample: userProgressDocs.slice(0, 3).map(p => ({
          questionId: p.questionId.toString(),
          state: p.state,
          wrongCount: p.wrongCount,
          rightCount: p.rightCount
        }))
      });
      
      // TEMPORARY: Log detailed user info to help identify the real user ID
      console.log('🚨 TEMPORARY DEBUG - User identification:', {
        userId,
        userIdLength: userId.length,
        userIdType: typeof userId,
        examNumber: filters.examNumber,
        subDomain: filters.subDomain,
        states: filters.states,
        timestamp: new Date().toISOString()
      });
      
      throw new NotFoundError(`No questions match the selected filters. Try different states or subdomains for ${filters.examNumber}.`);
    }
    
    // Shuffle questions
    const shuffled = shuffleArray(filteredQuestions);
    
    // Apply max questions limit
    const maxQuestions = filters.maxQuestions && filters.maxQuestions > 0 
      ? filters.maxQuestions 
      : shuffled.length;
    const selectedQuestions = shuffled.slice(0, maxQuestions);
    
    // Build session questions
    const sessionQuestions = selectedQuestions.map((q, index) => {
      const progress = progressMap.get(q._id.toString());
      const options = [];
      
      if (q.optionA) options.push({ letter: 'A', text: q.optionA });
      if (q.optionB) options.push({ letter: 'B', text: q.optionB });
      if (q.optionC) options.push({ letter: 'C', text: q.optionC });
      if (q.optionD) options.push({ letter: 'D', text: q.optionD });
      if (q.optionE) options.push({ letter: 'E', text: q.optionE });
      if (q.optionF) options.push({ letter: 'F', text: q.optionF });
      
      return {
        questionId: q._id.toString(),
        rowNum: index + 1,
        examNumber: q.examNumber,
        examName: q.examName || filters.examName,
        subDomain: q.subDomain,
        question: q.questionText,
        options,
        answer: q.answer || '',
        explanation: q.explanation || '',
        isMulti: (q.answer || '').includes(','),
        questionType: 0,
        countRight: progress?.rightCount || 0,
        countWrong: progress?.wrongCount || 0,
        originalNumber: q.originalNumber || ''
      };
    });
    
    // Create session
    const sessionId = `quiz_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await quizSessions.insertOne({
      sessionId,
      userId,
      questions: sessionQuestions,
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      filters,
      createdAt: new Date(),
      expiresAt
    });
    
    const result: QuizSession = {
      sessionId,
      total: sessionQuestions.length,
      examNumber: filters.examNumber,
      examName: filters.examName,
      subDomain: filters.subDomain || 'All'
    };
    
    logger.logExit('startQuiz', { sessionId, total: result.total });
    return result;
    
  } catch (error) {
    logger.logError('startQuiz', error as Error);
    throw error;
  }
}

/**
 * Gets the current question in an active quiz session
 * 
 * @param db - MongoDB database instance
 * @param userId - Cognito user ID
 * @param sessionId - Quiz session identifier
 * @param logger - Logger instance
 * @returns Current question data with shuffled options
 * @throws {NotFoundError} If session not found
 * @throws {UnauthorizedError} If session doesn't belong to user
 */
export async function getCurrentQuestion(
  db: Db,
  userId: string,
  sessionId: string,
  logger: Logger
): Promise<QuestionData | null> {
  logger.logEntry('getCurrentQuestion', { userId, sessionId });
  
  try {
    const quizSessions = db.collection('quizSessions');
    
    const session = await quizSessions.findOne({ sessionId });
    
    if (!session) {
      throw new NotFoundError('Quiz session');
    }
    
    if (session.userId !== userId) {
      throw new UnauthorizedError('Session does not belong to user');
    }
    
    // Check if quiz is complete
    if (session.currentIndex >= session.questions.length) {
      logger.logExit('getCurrentQuestion', { complete: true });
      return null;
    }
    
    const currentQ = session.questions[session.currentIndex];
    
    // Fetch the actual question from DB to get current markType
    const questions = db.collection('questions');
    const questionDoc = await questions.findOne({ _id: new ObjectId(currentQ.questionId) });
    
    // Shuffle options for display
    const shuffledOptions = shuffleArray(currentQ.options) as QuestionOption[];
    
    const result: QuestionData = {
      questionNumber: session.currentIndex + 1,
      total: session.questions.length,
      question: currentQ.question,
      options: shuffledOptions,
      isMulti: currentQ.isMulti,
      questionType: currentQ.questionType,
      rowNum: currentQ.rowNum,
      subDomain: currentQ.subDomain,
      countRight: currentQ.countRight,
      countWrong: currentQ.countWrong,
      sessionCorrect: session.correctCount,
      sessionWrong: session.wrongCount,
      originalNumber: currentQ.originalNumber,
      markType: questionDoc?.markType || 0
    };
    
    logger.logExit('getCurrentQuestion', { questionNumber: result.questionNumber });
    return result;
    
  } catch (error) {
    logger.logError('getCurrentQuestion', error as Error);
    throw error;
  }
}

/**
 * Submits an answer and updates user progress
 * 
 * @param db - MongoDB database instance
 * @param userId - Cognito user ID
 * @param submission - Answer submission data
 * @param logger - Logger instance
 * @returns Answer feedback with correctness and explanation
 * @throws {NotFoundError} If session not found
 * @throws {UnauthorizedError} If session doesn't belong to user
 */
export async function submitAnswer(
  db: Db,
  userId: string,
  submission: AnswerSubmission,
  logger: Logger
): Promise<AnswerFeedback> {
  logger.logEntry('submitAnswer', { userId, sessionId: submission.sessionId });
  
  try {
    const quizSessions = db.collection('quizSessions');
    const userProgress = db.collection('userProgress');
    
    const session = await quizSessions.findOne({ sessionId: submission.sessionId });
    
    if (!session) {
      throw new NotFoundError('Quiz session');
    }
    
    if (session.userId !== userId) {
      throw new UnauthorizedError('Session does not belong to user');
    }
    
    const currentQ = session.questions[session.currentIndex];
    
    // Parse correct answer(s)
    const correctLetters = currentQ.answer.split(',').map((l: string) => l.trim()).sort();
    const selectedLetters = submission.selectedLetters.map((l: string) => l.trim()).sort();
    
    // Check if answer is correct (all-or-nothing)
    const isCorrect = JSON.stringify(correctLetters) === JSON.stringify(selectedLetters);
    
    // Update user progress
    const questionId = currentQ.questionId;
    const uniqueIndex = `${userId}-${questionId}`;
    
    const existingProgress = await userProgress.findOne({ uniqueIndex });
    
    if (existingProgress) {
      // Update existing progress
      const newRightCount = isCorrect ? existingProgress.rightCount + 1 : existingProgress.rightCount;
      const newWrongCount = !isCorrect ? existingProgress.wrongCount + 1 : existingProgress.wrongCount;
      const newAttemptCount = existingProgress.attemptCount + 1;
      
      // Determine new state
      let newState = existingProgress.state;
      if (!isCorrect) {
        newState = 'WRONG';
      } else if (newRightCount >= 3) {
        newState = 'MASTERED';
      } else {
        newState = 'RIGHT';
      }
      
      await userProgress.updateOne(
        { uniqueIndex },
        {
          $set: {
            state: newState,
            attemptCount: newAttemptCount,
            rightCount: newRightCount,
            wrongCount: newWrongCount,
            lastUpdateDate: new Date()
          }
        }
      );
      
    } else {
      // Create new progress record
      await userProgress.insertOne({
        userId,
        questionId: new ObjectId(questionId),
        uniqueIndex,
        state: isCorrect ? 'RIGHT' : 'WRONG',
        attemptCount: 1,
        rightCount: isCorrect ? 1 : 0,
        wrongCount: isCorrect ? 0 : 1,
        lastUpdateDate: new Date(),
        createdDate: new Date()
      });
    }
    
    // Update session counters and move to next question
    const newCorrectCount = isCorrect ? session.correctCount + 1 : session.correctCount;
    const newWrongCount = !isCorrect ? session.wrongCount + 1 : session.wrongCount;
    const newIndex = session.currentIndex + 1;
    
    await quizSessions.updateOne(
      { sessionId: submission.sessionId },
      {
        $set: {
          currentIndex: newIndex,
          correctCount: newCorrectCount,
          wrongCount: newWrongCount
        }
      }
    );
    
    // Get updated progress for response
    const updatedProgress = await userProgress.findOne({ uniqueIndex });
    
    // Check if quiz is complete
    const isComplete = newIndex >= session.questions.length;
    
    const result: AnswerFeedback = {
      isCorrect,
      correctLetters,
      selectedLetters,
      explanation: currentQ.explanation,
      countRight: updatedProgress?.rightCount || 0,
      countWrong: updatedProgress?.wrongCount || 0,
      isComplete,
      summary: isComplete ? {
        correct: newCorrectCount,
        total: session.questions.length,
        percentage: Math.round((newCorrectCount / session.questions.length) * 100)
      } : undefined
    };
    
    logger.logExit('submitAnswer', { isCorrect, isComplete });
    return result;
    
  } catch (error) {
    logger.logError('submitAnswer', error as Error);
    throw error;
  }
}

/**
 * Marks a question as mastered for the user
 * 
 * @param db - MongoDB database instance
 * @param userId - Cognito user ID
 * @param questionId - Question identifier
 * @param logger - Logger instance
 * @returns Success boolean
 */
export async function markAsMastered(
  db: Db,
  userId: string,
  questionId: string,
  logger: Logger
): Promise<boolean> {
  logger.logEntry('markAsMastered', { userId, questionId });
  
  try {
    const userProgress = db.collection('userProgress');
    const uniqueIndex = `${userId}-${questionId}`;
    
    const existingProgress = await userProgress.findOne({ uniqueIndex });
    
    if (existingProgress) {
      await userProgress.updateOne(
        { uniqueIndex },
        {
          $set: {
            state: 'MASTERED',
            lastUpdateDate: new Date()
          }
        }
      );
    } else {
      await userProgress.insertOne({
        userId,
        questionId: new ObjectId(questionId),
        uniqueIndex,
        state: 'MASTERED',
        attemptCount: 0,
        rightCount: 0,
        wrongCount: 0,
        lastUpdateDate: new Date(),
        createdDate: new Date()
      });
    }
    
    logger.logExit('markAsMastered', { success: true });
    return true;
    
  } catch (error) {
    logger.logError('markAsMastered', error as Error);
    throw error;
  }
}


/**
 * Sets the mark type for a question
 * 
 * @param db - MongoDB database instance
 * @param userId - Cognito user ID (for authorization)
 * @param questionId - Question identifier
 * @param markType - Mark type (0=None, 1=Mark, 2=CreateMore, 3=Lab)
 * @param logger - Logger instance
 * @returns Success boolean
 */
export async function setQuestionMark(
  db: Db,
  userId: string,
  questionId: string,
  markType: number,
  logger: Logger
): Promise<boolean> {
  logger.logEntry('setQuestionMark', { userId, questionId, markType });
  
  try {
    const questions = db.collection('questions');
    
    await questions.updateOne(
      { _id: new ObjectId(questionId) },
      { $set: { markType } }
    );
    
    logger.logExit('setQuestionMark', { success: true });
    return true;
    
  } catch (error) {
    logger.logError('setQuestionMark', error as Error);
    throw error;
  }
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface SubdomainStats {
  subDomain: string;
  domainName: string;
  new: number;
  right: number;
  wrong: number;
  mastered: number;
  total: number;
}

export interface DashboardStats {
  examNumber: string;
  examName: string;
  subdomains: SubdomainStats[];
  totals: {
    new: number;
    right: number;
    wrong: number;
    mastered: number;
    total: number;
  };
}

/**
 * Gets dashboard statistics grouped by subdomain with exam filtering
 * 
 * @param db - MongoDB database instance
 * @param userId - Cognito user ID
 * @param examNumber - Exam filter (or "ALL" for all exams)
 * @param logger - Logger instance
 * @returns Dashboard statistics with subdomain breakdowns
 */
export async function getDashboardStats(
  db: Db,
  userId: string,
  examNumber: string,
  logger: Logger
): Promise<DashboardStats> {
  logger.logEntry('getDashboardStats', { userId, examNumber });
  
  try {
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Build match filter for exam
    const examFilter = examNumber === 'ALL' ? {} : { examNumber };
    
    // Get all questions matching exam filter
    const allQuestions = await questions.find(examFilter).toArray();
    
    // Get user progress for these questions
    const questionIds = allQuestions.map(q => q._id);
    const progressRecords = await userProgress.find({
      userId,
      questionId: { $in: questionIds }
    }).toArray();
    
    // Create progress map for quick lookup
    const progressMap = new Map();
    progressRecords.forEach(p => {
      progressMap.set(p.questionId.toString(), p);
    });
    
    // Group by subdomain number
    const subdomainMap = new Map<string, SubdomainStats>();
    
    allQuestions.forEach(question => {
      const subDomainNum = question.subDomainNum || 'Unknown';
      const subDomainName = question.subDomain || 'Unknown';
      const progress = progressMap.get(question._id.toString());
      const state = progress?.state || 'NEW';
      
      if (!subdomainMap.has(subDomainNum)) {
        subdomainMap.set(subDomainNum, {
          subDomain: subDomainNum,
          domainName: subDomainName,
          new: 0,
          right: 0,
          wrong: 0,
          mastered: 0,
          total: 0
        });
      }
      
      const stats = subdomainMap.get(subDomainNum)!;
      stats.total++;
      
      switch (state) {
        case 'NEW':
          stats.new++;
          break;
        case 'RIGHT':
          stats.right++;
          break;
        case 'WRONG':
          stats.wrong++;
          break;
        case 'MASTERED':
          stats.mastered++;
          break;
      }
    });
    
    // Convert to array and sort by subdomain
    const subdomains = Array.from(subdomainMap.values()).sort((a, b) => {
      return a.subDomain.localeCompare(b.subDomain, undefined, { numeric: true });
    });
    
    // Calculate totals
    const totals = {
      new: 0,
      right: 0,
      wrong: 0,
      mastered: 0,
      total: 0
    };
    
    subdomains.forEach(s => {
      totals.new += s.new;
      totals.right += s.right;
      totals.wrong += s.wrong;
      totals.mastered += s.mastered;
      totals.total += s.total;
    });
    
    // Get exam name
    let examName = 'All Exams';
    if (examNumber !== 'ALL' && allQuestions.length > 0) {
      examName = allQuestions[0].examName || examNumber;
    }
    
    const result = {
      examNumber,
      examName,
      subdomains,
      totals
    };
    
    logger.logExit('getDashboardStats', { 
      examNumber, 
      subdomainCount: subdomains.length,
      totalQuestions: totals.total 
    });
    
    return result;
    
  } catch (error) {
    logger.logError('getDashboardStats', error as Error);
    throw error;
  }
}
