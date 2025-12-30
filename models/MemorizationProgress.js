// models/MemorizationProgress.js

const mongoose = require('mongoose');

const LevelProgressSchema = new mongoose.Schema({
    level: { type: Number, required: true, min: 1, max: 15 },
    completedAt: { type: Date },
    studyTime: { type: Number, default: 0 }, // in seconds
    attempts: { type: Number, default: 0 },
    isMastered: { type: Boolean, default: false }
}, { _id: false });

const MemorizationProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MemorizationContent', required: true },
    levelProgress: [LevelProgressSchema],
    masteryLevel: { type: Number, default: 0, min: 0, max: 15 }, // Highest mastered level
    totalStudyTime: { type: Number, default: 0 }, // Total time in seconds
    lastStudiedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    
    // Unique constraint to ensure one progress record per user per content
    uniqueIndex: { type: String, unique: true }
});

// Pre-save hook to set unique index and update timestamps
MemorizationProgressSchema.pre('save', function(next) {
    if (!this.uniqueIndex) {
        this.uniqueIndex = `${this.userId}-${this.contentId}`;
    }
    
    // Update lastStudiedAt when progress is modified
    if (this.isModified('levelProgress') || this.isModified('totalStudyTime')) {
        this.lastStudiedAt = new Date();
    }
    
    // Calculate mastery level based on level progress
    if (this.levelProgress && this.levelProgress.length > 0) {
        const masteredLevels = this.levelProgress.filter(lp => lp.isMastered);
        this.masteryLevel = masteredLevels.length > 0 ? Math.max(...masteredLevels.map(lp => lp.level)) : 0;
    }
    
    next();
});

// Compound index for efficient user + content queries
MemorizationProgressSchema.index({ userId: 1, contentId: 1 });
MemorizationProgressSchema.index({ userId: 1 });
MemorizationProgressSchema.index({ lastStudiedAt: -1 });

module.exports = mongoose.models.MemorizationProgress || mongoose.model('MemorizationProgress', MemorizationProgressSchema);