// controllers/dashboardController.js (Must match this exactly)

const dashboardService = require('../services/dashboardService');
const { logger } = require('../utils/logger');

// Hardcoded ID for testing (must match the ID used in quizController)
const TEST_USER_ID = '60c72b22f03c9a1d9b32c3f8'; 


/**
 * Handles GET /api/dashboard/:examNumber?
 * This endpoint runs the aggregation pipeline for the user's progress dashboard.
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = TEST_USER_ID; 
        const examNumber = req.params.examNumber; // Optional filter from the URL

        // ✅ CRUCIAL LINE: Call the correct service function
        const stats = await dashboardService.getStatsBySubdomain(userId, examNumber);

        // ✅ CRUCIAL LINE: Return the success response
        res.status(200).json({ 
            success: true, 
            message: 'Dashboard stats retrieved.',
            data: stats 
        });

    } catch (error) {
        logger.error('Error retrieving dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics.' });
    }
};