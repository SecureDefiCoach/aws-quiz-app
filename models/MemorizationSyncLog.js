// models/MemorizationSyncLog.js

const mongoose = require('mongoose');

const MemorizationSyncLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    deviceId: { type: String, required: true },
    syncType: { 
        type: String, 
        enum: ['upload', 'download', 'conflict_resolution'],
        required: true 
    },
    contentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MemorizationContent' }],
    progressIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MemorizationProgress' }],
    syncStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'partial'],
        default: 'pending'
    },
    errorMessage: { type: String },
    syncedAt: { type: Date, default: Date.now },
    dataVersion: { type: String, required: true }, // Version hash for conflict detection
    conflictResolution: {
        strategy: { 
            type: String, 
            enum: ['server_wins', 'client_wins', 'merge', 'manual'],
            default: 'server_wins'
        },
        resolvedAt: { type: Date },
        resolvedBy: { type: String } // userId who resolved the conflict
    }
});

// Index for efficient sync queries
MemorizationSyncLogSchema.index({ userId: 1, syncedAt: -1 });
MemorizationSyncLogSchema.index({ userId: 1, deviceId: 1 });
MemorizationSyncLogSchema.index({ syncStatus: 1 });

module.exports = mongoose.models.MemorizationSyncLog || mongoose.model('MemorizationSyncLog', MemorizationSyncLogSchema);