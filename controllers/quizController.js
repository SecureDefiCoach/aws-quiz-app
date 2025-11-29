// controllers/quizController.js - Handles incoming HTTP requests and calls the service layer

const quizService = require('../services/quizService');
const { logger } = require('../utils/logger');

// --- Placeholder for a temporary User ID ---
// In a real app, userId comes from a secure session/login.
// For now, we will use a hardcoded ID for testing.
const TEST_USER_ID = '60c72b22f03c9a1d9b32c3f8'; 
const TEST_EXAM_NUMBER = 'SCS-C02'; // Replace with your default exam name


/**
 * Handles POST /api/start-quiz
 * This is the public endpoint your frontend will call to begin a quiz.
 */
exports.startQuiz = async (req, res) => {
    try {
        // In a real app, extract userId from req.user (session/auth token)
        const userId = TEST_USER_ID; 
        const examNumber = req.body.examNumber || TEST_EXAM_NUMBER; 

        const questions = await quizService.startQuiz(userId, examNumber);

        res.status(200).json({ 
            success: true, 
            message: 'Quiz started successfully.',
            data: questions 
        });

    } catch (error) {
        logger.error('Error starting quiz:', error);
        res.status(500).json({ success: false, message: 'Failed to start quiz session.' });
    }
};


/**
 * Handles POST /api/submit-answer
 * This is the public endpoint your frontend calls when a user submits an answer.
 */
exports.submitAnswer = async (req, res) => {
    try {
        const userId = TEST_USER_ID; 
        const { questionId, isCorrect } = req.body;

        if (!questionId || typeof isCorrect === 'undefined') {
            return res.status(400).json({ success: false, message: 'Missing questionId or isCorrect status.' });
        }

        const progress = await quizService.submitAnswer(userId, questionId, isCorrect);

        res.status(200).json({ 
            success: true, 
            message: 'Answer recorded.',
            data: progress 
        });

    } catch (error) {
        logger.error('Error submitting answer:', error);
        res.status(500).json({ success: false, message: 'Failed to submit answer.' });
    }
};