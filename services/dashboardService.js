// services/dashboardService.js - Core logic for generating quiz statistics

const UserProgress = require('../models/UserProgress');
const Question = require('../models/Question');
const { logger } = require('../utils/logger');


/**
 * Logic to calculate the user's progress summary for a given exam or overall.
 * This utilizes the powerful MongoDB Aggregation Pipeline.
 *
 * @param {string} userId - The unique ID of the current user.
 * @param {string} examNumber - Optional exam to filter by.
 * @returns {Promise<Array>} - Array containing detailed progress statistics by subdomain.
 */
exports.getStatsBySubdomain = async (userId, examNumber) => {
    logger.info('Starting dashboard aggregation pipeline.', { userId, exam: examNumber });

    // Helper to convert the string ID to a MongoDB Object ID
    const userObjectId = new UserProgress.base.Types.ObjectId(userId);

    const pipeline = [
        // 1. Filter: Find only the progress records for this specific user
        { $match: { userId: userObjectId } },

        // 2. Lookup/Join: "Join" UserProgress with the Question data
        { $lookup: {
            from: 'questions', // The name of the collection to join
            localField: 'questionId',
            foreignField: '_id',
            as: 'questionDetails'
        }},

        // 3. Unwind: Flatten the results to access the question fields
        { $unwind: '$questionDetails' },

        // 4. Filter by Exam (conditionally if examNumber is provided)
        examNumber ? { $match: { 'questionDetails.examNumber': examNumber } } : null,
        
        // 5. Group: Group by Subdomain and calculate summary metrics
        { $group: {
            _id: {
                subDomainNum: '$questionDetails.subDomainNum',
                subDomain: '$questionDetails.subDomain',
            },
            totalAttempted: { $sum: 1 }, // Total questions attempted in this subdomain
            masteredCount: { $sum: { $cond: [{ $eq: ['$status', 'MASTERED'] }, 1, 0] } },
            correctCount: { $sum: { $cond: [{ $in: ['$status', ['MASTERED', 'RIGHT']] }, 1, 0] } },
            wrongCount: { $sum: { $cond: [{ $eq: ['$status', 'WRONG'] }, 1, 0] } },
        }},

        // 6. Project/Format: Clean up the output structure and calculate percentages
        { $project: {
            _id: 0,
            subDomainNum: '$_id.subDomainNum',
            subDomain: '$_id.subDomain',
            totalAttempted: 1,
            masteredCount: 1,
            correctCount: 1,
            wrongCount: 1,
            masteryPercentage: { 
                $multiply: [
                    { $divide: ['$masteredCount', '$totalAttempted'] }, 
                    100
                ]
            }
        }},
        
        // 7. Sort: Sort the final results by subdomain number
        { $sort: { subDomainNum: 1 } }
    ].filter(Boolean); // Filter(Boolean) removes the conditional $match stage if examNumber is null
    
    // Execute the pipeline
    return UserProgress.aggregate(pipeline);
};