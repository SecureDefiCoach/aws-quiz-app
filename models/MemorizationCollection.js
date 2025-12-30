// models/MemorizationCollection.js

const mongoose = require('mongoose');

const MemorizationCollectionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { 
        type: String, 
        enum: ['quiz-explanations', 'interview-responses', 'custom'],
        default: 'custom'
    },
    contentItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MemorizationContent' }],
    isOfflineAvailable: { type: Boolean, default: false },
    totalItems: { type: Number, default: 0 },
    masteredItems: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
MemorizationCollectionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index for efficient user queries
MemorizationCollectionSchema.index({ userId: 1 });
MemorizationCollectionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.models.MemorizationCollection || mongoose.model('MemorizationCollection', MemorizationCollectionSchema);