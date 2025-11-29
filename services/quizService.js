// services/quizService.js - Core business logic for quiz management

const Question = require('../models/Question'); // ✅ Verify this line
const UserProgress = require('../models/UserProgress'); // ✅ Verify this line
const { logger } = require('../utils/logger'); // For logging events

/**
 * 1. Logic to start a new quiz session (replaces part of startQuiz in Code.gs)
 * This function fetches a set of unattempted or mastered questions for the user.
 * @param {string} userId - The unique ID of the current user.
 * @param {string} examNumber - The exam to filter questions by (e.g., 'SCS-C02').
 * @returns {Promise<Array>} - A list of quiz questions.
 */
exports.startQuiz = async (userId, examNumber) => {
    logger.info('Quiz session starting.', { userId: userId, exam: examNumber });

    // Step 1: Find all questions this user has NOT mastered for this exam
    // This is the core logic that replaces complex VLOOKUP/FILTER in Sheets.
    const masteredQuestionIds = await UserProgress.find({
        userId: userId,
        status: 'MASTERED'
    }).select('questionId');

    const masteredIds = masteredQuestionIds.map(p => p.questionId);

    // Step 2: Fetch 10 random questions that are NOT in the mastered list
    // Use the $nin (not in) operator for powerful filtering.
    const quizQuestions = await Question.aggregate([
        { $match: { 
            examNumber: examNumber, 
            _id: { $nin: masteredIds } 
        }},
        { $sample: { size: 10 } } // Get 10 random documents
    ]);

    logger.info(`Fetched ${quizQuestions.length} new/review questions.`, { userId });
    return quizQuestions;
};


/**
 * 2. Logic to handle answer submission (replaces submitAnswer in Code.gs)
 * @param {string} userId - The unique ID of the current user.
 * @param {string} questionId - The question being answered.
 * @param {boolean} isCorrect - Whether the user got the answer right.
 * @returns {Promise<object>} - The updated progress record.
 */
exports.submitAnswer = async (userId, questionId, isCorrect) => {
    // 1. Create a unique identifier for this specific user/question combination
    const uniqueIndex = `${userId}-${questionId}`;

    // 2. Find and update the user's progress record, or create it if it doesn't exist
    const progressRecord = await UserProgress.findOneAndUpdate(
        { uniqueIndex: uniqueIndex },
        { 
            $inc: { attemptCount: 1 }, // Increment the attempt count
            $set: { 
                lastUpdateDate: new Date(), 
                userId: userId, 
                questionId: questionId 
            }
        },
        { 
            upsert: true, // Creates the document if it doesn't exist
            new: true     // Returns the updated document
        }
    );

    // 3. Update the status based on correctness and attempt history (simplified logic)
    if (isCorrect) {
        // If they got it right, move them to 'RIGHT' or 'MASTERED'
        if (progressRecord.status === 'MASTERED') {
            // Keep status as MASTERED
        } else if (progressRecord.attemptCount >= 3) { 
            progressRecord.status = 'MASTERED'; // Mastered after 3+ correct attempts
        } else {
            progressRecord.status = 'RIGHT';
        }
    } else {
        // If they got it wrong, reset status to 'WRONG'
        progressRecord.status = 'WRONG';
    }

    await progressRecord.save();

    logger.info('Answer submitted and progress updated.', { userId, questionId, correct: isCorrect, newStatus: progressRecord.status });
    
    return progressRecord;
};