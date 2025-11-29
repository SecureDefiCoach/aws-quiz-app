// server.js - Main Application Entry Point

const express = require('express');
const quizRoutes = require('./routes/quizRoutes');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { logger } = require('./utils/logger'); // Our custom logger

require('./models/Question');
require('./models/UserProgress');
require('./models/User');
// --- CONFIGURATION ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// --- MIDDLEWARE ---
app.use(express.json()); // Allows parsing JSON requests
app.use(express.urlencoded({ extended: true })); // Helps with form data
app.use('/api', quizRoutes); // 2. USE ROUTES (This is the line that was missing!)
// --- DATABASE CONNECTION ---
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'aws-quiz-db' });
        logger.info('Database connected successfully to MongoDB Atlas.');
    } catch (err) {
        logger.error(`Database connection failed: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
}

// --- ROUTES (Placeholder) ---
app.get('/', (req, res) => {
    logger.info('GET / request received');
    res.status(200).send('AWS Quiz Backend running. Ready to receive API calls.');
});

// --- SERVER STARTUP ---
connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info(`Server listening on port ${PORT}.`);
        logger.info(`Running in ${process.env.NODE_ENV || 'development'} mode.`);
    });
});