// controllers/memorizationController.js - Handles HTTP requests for memorization functionality

const memorizationContentService = require('../services/memorizationContentService');
const deletionGenerationService = require('../services/deletionGenerationService');
const memorizationProgressService = require('../services/memorizationProgressService');
const { logger } = require('../utils/logger');

// User ID for tristanmarvin@outlook.com (development)
const TEST_USER_ID = '677c8b2ef03c9a1d9b32c3f9';

// --- COLLECTION CONTROLLERS ---

/**
 * GET /api/memorization/collections
 * Get all collections for the authenticated user
 */
exports.getCollections = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        
        const collections = await memorizationContentService.getCollections(userId);
        
        res.status(200).json({
            success: true,
            message: 'Collections retrieved successfully',
            data: collections
        });
        
    } catch (error) {
        logger.error('Error getting collections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve collections'
        });
    }
};

/**
 * POST /api/memorization/collections
 * Create a new collection
 */
exports.createCollection = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        const { name, description, category } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Collection name is required'
            });
        }
        
        const collection = await memorizationContentService.createCollection(userId, {
            name,
            description,
            category
        });
        
        res.status(201).json({
            success: true,
            message: 'Collection created successfully',
            data: collection
        });
        
    } catch (error) {
        logger.error('Error creating collection:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create collection'
        });
    }
};

/**
 * GET /api/memorization/collections/:id
 * Get a specific collection with its content items
 */
exports.getCollection = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        const { id } = req.params;
        
        const collection = await memorizationContentService.getCollection(id, userId);
        
        res.status(200).json({
            success: true,
            message: 'Collection retrieved successfully',
            data: collection
        });
        
    } catch (error) {
        logger.error('Error getting collection:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve collection'
        });
    }
};

/**
 * DELETE /api/memorization/collections/:id
 * Delete a collection and all its content
 */
exports.deleteCollection = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        const { id } = req.params;
        
        await memorizationContentService.deleteCollection(id, userId);
        
        res.status(200).json({
            success: true,
            message: 'Collection deleted successfully'
        });
        
    } catch (error) {
        logger.error('Error deleting collection:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete collection'
        });
    }
};
// --- CONTENT CONTROLLERS ---

/**
 * GET /api/memorization/content/:id
 * Get content item with all deletion levels
 */
exports.getContent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const content = await memorizationContentService.getContentWithLevels(id);
        
        res.status(200).json({
            success: true,
            message: 'Content retrieved successfully',
            data: content
        });
        
    } catch (error) {
        logger.error('Error getting content:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve content'
        });
    }
};

/**
 * POST /api/memorization/content
 * Add new content to a collection
 */
exports.addContent = async (req, res) => {
    try {
        const { collectionId, title, originalText, metadata } = req.body;
        
        if (!collectionId || !title || !originalText) {
            return res.status(400).json({
                success: false,
                message: 'Collection ID, title, and original text are required'
            });
        }
        
        const content = await memorizationContentService.addContentToCollection(collectionId, {
            title,
            originalText,
            metadata
        });
        
        res.status(201).json({
            success: true,
            message: 'Content added successfully',
            data: content
        });
        
    } catch (error) {
        logger.error('Error adding content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add content'
        });
    }
};

/**
 * PUT /api/memorization/content/:id
 * Update content item
 */
exports.updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const content = await memorizationContentService.updateContent(id, updateData);
        
        res.status(200).json({
            success: true,
            message: 'Content updated successfully',
            data: content
        });
        
    } catch (error) {
        logger.error('Error updating content:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update content'
        });
    }
};

/**
 * DELETE /api/memorization/content/:id
 * Delete content item
 */
exports.deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        
        await memorizationContentService.deleteContent(id);
        
        res.status(200).json({
            success: true,
            message: 'Content deleted successfully'
        });
        
    } catch (error) {
        logger.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete content'
        });
    }
};

/**
 * POST /api/memorization/content/:id/generate-levels
 * Generate deletion levels for content
 */
exports.generateDeletionLevels = async (req, res) => {
    try {
        const { id } = req.params;
        
        const content = await deletionGenerationService.applyDeletionLevels(id);
        
        res.status(200).json({
            success: true,
            message: 'Deletion levels generated successfully',
            data: content
        });
        
    } catch (error) {
        logger.error('Error generating deletion levels:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate deletion levels'
        });
    }
};
// --- PROGRESS CONTROLLERS ---

/**
 * GET /api/memorization/progress
 * Get all progress for user
 */
exports.getProgress = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        
        const progress = await memorizationProgressService.getProgress(userId);
        
        res.status(200).json({
            success: true,
            message: 'Progress retrieved successfully',
            data: progress
        });
        
    } catch (error) {
        logger.error('Error getting progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve progress'
        });
    }
};

/**
 * GET /api/memorization/progress/:contentId
 * Get progress for specific content
 */
exports.getContentProgress = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        const { contentId } = req.params;
        
        const progress = await memorizationProgressService.getProgress(userId, contentId);
        
        res.status(200).json({
            success: true,
            message: 'Content progress retrieved successfully',
            data: progress
        });
        
    } catch (error) {
        logger.error('Error getting content progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve content progress'
        });
    }
};

/**
 * POST /api/memorization/progress/session
 * Record a study session
 */
exports.recordStudySession = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        const { contentId, level, studyTime, completed } = req.body;
        
        if (!contentId || !level || typeof studyTime !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Content ID, level, and study time are required'
            });
        }
        
        const progress = await memorizationProgressService.recordStudySession(userId, contentId, {
            level,
            studyTime,
            completed
        });
        
        res.status(200).json({
            success: true,
            message: 'Study session recorded successfully',
            data: progress
        });
        
    } catch (error) {
        logger.error('Error recording study session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record study session'
        });
    }
};

/**
 * PUT /api/memorization/progress/:contentId/mastery
 * Update mastery level for content
 */
exports.updateMasteryLevel = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        const { contentId } = req.params;
        const { level } = req.body;
        
        if (!level || level < 1 || level > 15) {
            return res.status(400).json({
                success: false,
                message: 'Valid mastery level (1-15) is required'
            });
        }
        
        const progress = await memorizationProgressService.updateMasteryLevel(userId, contentId, level);
        
        res.status(200).json({
            success: true,
            message: 'Mastery level updated successfully',
            data: progress
        });
        
    } catch (error) {
        logger.error('Error updating mastery level:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update mastery level'
        });
    }
};

/**
 * GET /api/memorization/progress/statistics
 * Get comprehensive statistics for user
 */
exports.getStatistics = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        
        const statistics = await memorizationProgressService.getStatistics(userId);
        
        res.status(200).json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: statistics
        });
        
    } catch (error) {
        logger.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve statistics'
        });
    }
};

/**
 * GET /api/memorization/progress/practice-recommendations
 * Get items that need more practice
 */
exports.getPracticeRecommendations = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        const limit = parseInt(req.query.limit) || 10;
        
        const recommendations = await memorizationProgressService.getItemsNeedingPractice(userId, limit);
        
        res.status(200).json({
            success: true,
            message: 'Practice recommendations retrieved successfully',
            data: recommendations
        });
        
    } catch (error) {
        logger.error('Error getting practice recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve practice recommendations'
        });
    }
};
// --- IMPORT CONTROLLERS ---

/**
 * POST /api/memorization/import/quiz-explanations
 * Import quiz explanations into memorization collections
 */
exports.importQuizExplanations = async (req, res) => {
    try {
        const userId = TEST_USER_ID; // In production: req.user.id
        const { examNumber } = req.body;
        
        if (!examNumber) {
            return res.status(400).json({
                success: false,
                message: 'Exam number is required'
            });
        }
        
        const result = await memorizationContentService.importQuizExplanations(userId, examNumber);
        
        res.status(201).json({
            success: true,
            message: `Successfully imported ${result.totalImported} explanations from ${examNumber}`,
            data: result
        });
        
    } catch (error) {
        logger.error('Error importing quiz explanations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to import quiz explanations'
        });
    }
};