// routes/quizRoutes.js

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const dashboardController = require('../controllers/dashboardController'); // <<< NEW IMPORT

// --- PUBLIC QUIZ ENDPOINTS ---
router.post('/start-quiz', quizController.startQuiz);
router.post('/submit-answer', quizController.submitAnswer);

// 3. Gets dashboard stats (Use the new dashboardController!)
router.get('/dashboard/:examNumber?', dashboardController.getDashboardStats); // <<< UPDATED LINE

module.exports = router;