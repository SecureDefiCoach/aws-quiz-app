// models/MemorizationContent.js

const mongoose = require('mongoose');

const DeletedWordSchema = new mongoose.Schema({
    position: { type: Number, required: true },
    originalWord: { type: String, required: true },
    isKeyTerm: { type: Boolean, default: false }
}, { _id: false });

const DeletionLevelSchema = new mongoose.Schema({
    level: { type: Number, required: true, min: 1, max: 15 },
    text: { type: String, required: true },
    deletedWords: [DeletedWordSchema],
    deletionCount: { type: Number, required: true },
    deletionPercentage: { type: Number, required: true }
}, { _id: false });

const MemorizationContentSchema = new mongoose.Schema({
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MemorizationCollection', required: true },
    title: { type: String, required: true },
    originalText: { type: String, required: true },
    deletionLevels: [DeletionLevelSchema],
    metadata: {
        source: { type: String },
        questionNumber: { type: String },
        examNumber: { type: String },
        tags: [{ type: String }]
    },
    wordCount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Validate that we have exactly 15 deletion levels
MemorizationContentSchema.pre('save', function(next) {
    if (this.deletionLevels && this.deletionLevels.length !== 15) {
        return next(new Error('Content must have exactly 15 deletion levels'));
    }
    next();
});

// Index for efficient collection queries
MemorizationContentSchema.index({ collectionId: 1 });
MemorizationContentSchema.index({ 'metadata.examNumber': 1 });
MemorizationContentSchema.index({ 'metadata.tags': 1 });

module.exports = mongoose.models.MemorizationContent || mongoose.model('MemorizationContent', MemorizationContentSchema);