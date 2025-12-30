// routes/memorizationRoutes.js - API routes for memorization functionality

const express = require('express');
const router = express.Router();
const memorizationController = require('../controllers/memorizationController');

// --- COLLECTION ENDPOINTS ---
// GET /api/memorization/collections - Get all collections for user
router.get('/collections', memorizationController.getCollections);

// GET /api/memorization/collections/:id - Get specific collection
router.get('/collections/:id', memorizationController.getCollection);

// POST /api/memorization/collections - Create new collection
router.post('/collections', memorizationController.createCollection);

// DELETE /api/memorization/collections/:id - Delete collection
router.delete('/collections/:id', memorizationController.deleteCollection);

// --- CONTENT ENDPOINTS ---
// GET /api/memorization/content/:id - Get content with deletion levels
router.get('/content/:id', memorizationController.getContent);

// POST /api/memorization/content - Add content to collection
router.post('/content', memorizationController.addContent);

// PUT /api/memorization/content/:id - Update content
router.put('/content/:id', memorizationController.updateContent);

// DELETE /api/memorization/content/:id - Delete content
router.delete('/content/:id', memorizationController.deleteContent);

// POST /api/memorization/content/:id/generate-levels - Generate deletion levels for content
router.post('/content/:id/generate-levels', memorizationController.generateDeletionLevels);

// --- PROGRESS ENDPOINTS ---
// GET /api/memorization/progress - Get all progress for user
router.get('/progress', memorizationController.getProgress);

// GET /api/memorization/progress/:contentId - Get progress for specific content
router.get('/progress/:contentId', memorizationController.getContentProgress);

// POST /api/memorization/progress/session - Record study session
router.post('/progress/session', memorizationController.recordStudySession);

// PUT /api/memorization/progress/:contentId/mastery - Update mastery level
router.put('/progress/:contentId/mastery', memorizationController.updateMasteryLevel);

// GET /api/memorization/progress/statistics - Get user statistics
router.get('/progress/statistics', memorizationController.getStatistics);

// GET /api/memorization/progress/practice-recommendations - Get items needing practice
router.get('/progress/practice-recommendations', memorizationController.getPracticeRecommendations);

// --- IMPORT ENDPOINTS ---
// POST /api/memorization/import/quiz-explanations - Import quiz explanations
router.post('/import/quiz-explanations', memorizationController.importQuizExplanations);

module.exports = router;