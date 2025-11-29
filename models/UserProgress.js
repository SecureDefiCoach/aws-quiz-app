// models/UserProgress.js

const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    // --- RELATIONSHIPS (The "Keys") ---
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    
    // --- STATUS FIELD ---
    status: {
        type: String,
        enum: ['NEW', 'WRONG', 'RIGHT', 'MASTERED'],
        default: 'NEW'
    },

    // --- TRACKING ---
    attemptCount: { type: Number, default: 0 },
    lastUpdateDate: { type: Date, default: Date.now },

    // Ensures one user only has one status record per question
    uniqueIndex: { type: String, unique: true } 
});

// Pre-save hook to ensure the unique index is set before saving
UserProgressSchema.pre('save', function(next) {
    if (!this.uniqueIndex) {
        // We use a simple concatenation for the unique key
        this.uniqueIndex = `${this.userId}-${this.questionId}`;
    }
    next();
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);