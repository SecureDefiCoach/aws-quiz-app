// services/memorizationProgressService.js - Progress tracking for memorization sessions

const MemorizationProgress = require('../models/MemorizationProgress');
const MemorizationContent = require('../models/MemorizationContent');
const MemorizationCollection = require('../models/MemorizationCollection');
const { logger } = require('../utils/logger');

/**
 * Record a study session for a content item
 * @param {string} userId - The user ID
 * @param {string} contentId - The content item ID
 * @param {object} sessionData - Session data (level, studyTime, completed)
 * @returns {Promise<object>} - Updated progress record
 */
exports.recordStudySession = async (userId, contentId, sessionData) => {
    logger.info('Recording study session', { 
        userId, 
        contentId, 
        level: sessionData.level,
        studyTime: sessionData.studyTime 
    });

    const { level, studyTime, completed = false } = sessionData;

    // Find or create progress record
    let progress = await MemorizationProgress.findOne({ userId, contentId });
    
    if (!progress) {
        progress = new MemorizationProgress({
            userId,
            contentId,
            levelProgress: Array.from({ length: 15 }, (_, i) => ({
                level: i + 1,
                studyTime: 0,
                attempts: 0,
                isMastered: false
            }))
        });
    }

    // Update the specific level progress
    const levelIndex = level - 1;
    if (levelIndex >= 0 && levelIndex < 15) {
        progress.levelProgress[levelIndex].studyTime += studyTime;
        progress.levelProgress[levelIndex].attempts += 1;
        
        if (completed) {
            progress.levelProgress[levelIndex].isMastered = true;
            progress.levelProgress[levelIndex].completedAt = new Date();
        }
    }

    // Update total study time
    progress.totalStudyTime += studyTime;

    await progress.save();

    logger.info('Study session recorded successfully', { 
        userId, 
        contentId, 
        level,
        totalStudyTime: progress.totalStudyTime,
        masteryLevel: progress.masteryLevel 
    });

    return progress;
};

/**
 * Get progress for user's content (specific item or all)
 * @param {string} userId - The user ID
 * @param {string} contentId - Optional specific content ID
 * @returns {Promise<object|Array>} - Progress data
 */
exports.getProgress = async (userId, contentId = null) => {
    logger.info('Fetching progress', { userId, contentId });

    if (contentId) {
        // Get progress for specific content
        const progress = await MemorizationProgress.findOne({ userId, contentId })
            .populate('contentId', 'title wordCount collectionId');
        
        return progress;
    } else {
        // Get all progress for user
        const allProgress = await MemorizationProgress.find({ userId })
            .populate('contentId', 'title wordCount collectionId')
            .sort({ lastStudiedAt: -1 });
        
        return allProgress;
    }
};

/**
 * Update mastery level for a content item
 * @param {string} userId - The user ID
 * @param {string} contentId - The content item ID
 * @param {number} level - The level achieved (1-15)
 * @returns {Promise<object>} - Updated progress record
 */
exports.updateMasteryLevel = async (userId, contentId, level) => {
    logger.info('Updating mastery level', { userId, contentId, level });

    const progress = await MemorizationProgress.findOne({ userId, contentId });
    
    if (!progress) {
        throw new Error('Progress record not found');
    }

    // Mark all levels up to the specified level as mastered
    for (let i = 0; i < level && i < 15; i++) {
        progress.levelProgress[i].isMastered = true;
        if (!progress.levelProgress[i].completedAt) {
            progress.levelProgress[i].completedAt = new Date();
        }
    }

    await progress.save();

    logger.info('Mastery level updated successfully', { 
        userId, 
        contentId, 
        newMasteryLevel: progress.masteryLevel 
    });

    return progress;
};
/**
 * Get comprehensive statistics for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object>} - Statistics object
 */
exports.getStatistics = async (userId) => {
    logger.info('Calculating statistics', { userId });

    const allProgress = await MemorizationProgress.find({ userId })
        .populate('contentId', 'title wordCount collectionId');

    const collections = await MemorizationCollection.find({ userId });

    // Calculate overall statistics
    const totalItems = allProgress.length;
    const totalStudyTime = allProgress.reduce((sum, p) => sum + p.totalStudyTime, 0);
    
    // Calculate mastery statistics
    const masteryStats = allProgress.reduce((stats, progress) => {
        const masteredLevels = progress.levelProgress.filter(lp => lp.isMastered).length;
        
        if (masteredLevels === 15) {
            stats.fullyMastered++;
        } else if (masteredLevels >= 10) {
            stats.nearlyMastered++;
        } else if (masteredLevels >= 5) {
            stats.partiallyMastered++;
        } else if (masteredLevels > 0) {
            stats.started++;
        } else {
            stats.notStarted++;
        }
        
        return stats;
    }, {
        fullyMastered: 0,
        nearlyMastered: 0,
        partiallyMastered: 0,
        started: 0,
        notStarted: 0
    });

    // Calculate collection-level statistics
    const collectionStats = collections.map(collection => {
        const collectionProgress = allProgress.filter(p => 
            p.contentId && p.contentId.collectionId && 
            p.contentId.collectionId.toString() === collection._id.toString()
        );

        const totalCollectionItems = collectionProgress.length;
        const masteredItems = collectionProgress.filter(p => p.masteryLevel === 15).length;
        const totalCollectionStudyTime = collectionProgress.reduce((sum, p) => sum + p.totalStudyTime, 0);

        return {
            collectionId: collection._id,
            name: collection.name,
            category: collection.category,
            totalItems: totalCollectionItems,
            masteredItems,
            masteryPercentage: totalCollectionItems > 0 ? 
                Math.round((masteredItems / totalCollectionItems) * 100) : 0,
            totalStudyTime: totalCollectionStudyTime,
            averageStudyTimePerItem: totalCollectionItems > 0 ? 
                Math.round(totalCollectionStudyTime / totalCollectionItems) : 0
        };
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentProgress = allProgress.filter(p => 
        p.lastStudiedAt && p.lastStudiedAt >= sevenDaysAgo
    );

    const recentStudyTime = recentProgress.reduce((sum, p) => {
        // Calculate study time in the last 7 days
        const recentLevelProgress = p.levelProgress.filter(lp => 
            lp.completedAt && lp.completedAt >= sevenDaysAgo
        );
        return sum + recentLevelProgress.reduce((levelSum, lp) => levelSum + lp.studyTime, 0);
    }, 0);

    const statistics = {
        overview: {
            totalItems,
            totalStudyTime,
            averageStudyTimePerItem: totalItems > 0 ? Math.round(totalStudyTime / totalItems) : 0,
            totalCollections: collections.length
        },
        mastery: masteryStats,
        collections: collectionStats,
        recentActivity: {
            itemsStudied: recentProgress.length,
            studyTime: recentStudyTime,
            averageDailyStudyTime: Math.round(recentStudyTime / 7)
        }
    };

    logger.info('Statistics calculated successfully', { 
        userId, 
        totalItems,
        totalStudyTime,
        collections: collections.length 
    });

    return statistics;
};

/**
 * Get items that need more practice (low mastery levels)
 * @param {string} userId - The user ID
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} - Array of content items needing practice
 */
exports.getItemsNeedingPractice = async (userId, limit = 10) => {
    logger.info('Finding items needing practice', { userId, limit });

    const allProgress = await MemorizationProgress.find({ userId })
        .populate('contentId', 'title wordCount collectionId')
        .sort({ masteryLevel: 1, lastStudiedAt: 1 }); // Lowest mastery first, oldest study first

    // Filter items that need practice (mastery level < 15)
    const itemsNeedingPractice = allProgress
        .filter(progress => progress.masteryLevel < 15)
        .slice(0, limit)
        .map(progress => ({
            contentId: progress.contentId._id,
            title: progress.contentId.title,
            masteryLevel: progress.masteryLevel,
            totalStudyTime: progress.totalStudyTime,
            lastStudiedAt: progress.lastStudiedAt,
            nextRecommendedLevel: Math.min(progress.masteryLevel + 1, 15),
            urgencyScore: exports.calculateUrgencyScore(progress)
        }));

    logger.info(`Found ${itemsNeedingPractice.length} items needing practice`, { userId });

    return itemsNeedingPractice;
};

/**
 * Calculate urgency score for practice prioritization
 * @param {object} progress - Progress record
 * @returns {number} - Urgency score (higher = more urgent)
 */
exports.calculateUrgencyScore = (progress) => {
    let score = 0;
    
    // Base score from inverse mastery level (lower mastery = higher urgency)
    score += (15 - progress.masteryLevel) * 10;
    
    // Time since last study (older = higher urgency)
    if (progress.lastStudiedAt) {
        const daysSinceStudy = (Date.now() - progress.lastStudiedAt.getTime()) / (1000 * 60 * 60 * 24);
        score += Math.min(daysSinceStudy * 2, 20); // Cap at 20 points for 10+ days
    } else {
        score += 30; // Never studied gets high urgency
    }
    
    // Low study time relative to mastery level (needs more practice)
    const expectedStudyTime = progress.masteryLevel * 60; // 1 minute per level expected
    if (progress.totalStudyTime < expectedStudyTime) {
        score += (expectedStudyTime - progress.totalStudyTime) / 10;
    }
    
    return Math.round(score);
};