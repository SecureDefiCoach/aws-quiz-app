// services/memorizationContentService.js - Core business logic for memorization content management

const MemorizationCollection = require('../models/MemorizationCollection');
const MemorizationContent = require('../models/MemorizationContent');
const Question = require('../models/Question');
const { logger } = require('../utils/logger');

/**
 * Create a new memorization collection for a user
 * @param {string} userId - The unique ID of the user
 * @param {object} collectionData - Collection data (name, description, category)
 * @returns {Promise<object>} - The created collection
 */
exports.createCollection = async (userId, collectionData) => {
    logger.info('Creating new memorization collection', { userId, name: collectionData.name });

    const collection = new MemorizationCollection({
        userId,
        name: collectionData.name,
        description: collectionData.description || '',
        category: collectionData.category || 'custom'
    });

    await collection.save();
    
    logger.info('Memorization collection created successfully', { 
        userId, 
        collectionId: collection._id,
        name: collection.name 
    });
    
    return collection;
};

/**
 * Get all collections for a user
 * @param {string} userId - The unique ID of the user
 * @returns {Promise<Array>} - Array of user's collections
 */
exports.getCollections = async (userId) => {
    logger.info('Fetching memorization collections', { userId });

    const collections = await MemorizationCollection.find({ userId })
        .populate('contentItems', 'title wordCount createdAt')
        .sort({ updatedAt: -1 });

    logger.info(`Found ${collections.length} collections`, { userId });
    
    return collections;
};

/**
 * Get a specific collection with its content items
 * @param {string} collectionId - The collection ID
 * @param {string} userId - The unique ID of the user (for security)
 * @returns {Promise<object>} - The collection with populated content items
 */
exports.getCollection = async (collectionId, userId) => {
    logger.info('Fetching memorization collection', { collectionId, userId });

    const collection = await MemorizationCollection.findOne({ 
        _id: collectionId, 
        userId 
    }).populate('contentItems', 'title wordCount createdAt');

    if (!collection) {
        throw new Error('Collection not found or access denied');
    }

    logger.info('Collection retrieved successfully', { 
        collectionId, 
        userId,
        contentItemsCount: collection.contentItems.length 
    });
    
    return collection;
};

/**
 * Add content item to a collection (with deletion levels generated immediately)
 * @param {string} collectionId - The collection ID
 * @param {object} contentData - Content data (title, originalText, metadata)
 * @returns {Promise<object>} - The created content item
 */
exports.addContentToCollection = async (collectionId, contentData) => {
    logger.info('Adding content to collection', { collectionId, title: contentData.title });

    // Calculate word count
    const wordCount = contentData.originalText.trim().split(/\s+/).length;

    // Generate deletion levels immediately
    const deletionGenerationService = require('./deletionGenerationService');
    const deletionLevels = await deletionGenerationService.generateDeletionLevels(contentData.originalText);

    const contentItem = new MemorizationContent({
        collectionId,
        title: contentData.title,
        originalText: contentData.originalText,
        wordCount,
        metadata: contentData.metadata || {},
        deletionLevels: deletionLevels // Generated immediately
    });

    await contentItem.save();

    // Update collection's content items array and total count
    await MemorizationCollection.findByIdAndUpdate(
        collectionId,
        {
            $push: { contentItems: contentItem._id },
            $inc: { totalItems: 1 },
            $set: { updatedAt: new Date() }
        }
    );

    logger.info('Content added to collection successfully', { 
        collectionId, 
        contentId: contentItem._id,
        wordCount 
    });
    
    return contentItem;
};

/**
 * Import quiz explanations into memorization collections
 * @param {string} userId - The unique ID of the user
 * @param {string} examNumber - The exam number to import from (e.g., 'SCS-C02')
 * @returns {Promise<object>} - The created collection with imported content
 */
exports.importQuizExplanations = async (userId, examNumber) => {
    logger.info('Importing quiz explanations', { userId, examNumber });

    // Create collection for this exam
    const collection = await exports.createCollection(userId, {
        name: `${examNumber} Explanations`,
        description: `Imported explanations from ${examNumber} quiz questions`,
        category: 'quiz-explanations'
    });

    // Find questions with explanations for this exam
    const questionsWithExplanations = await Question.find({
        examNumber,
        explanation: { $exists: true, $ne: '' }
    }).select('questionNumber explanation correctAnswer questionText subDomain');

    logger.info(`Found ${questionsWithExplanations.length} questions with explanations`, { 
        userId, 
        examNumber 
    });

    // Import each explanation as content
    const importedContent = [];
    for (const question of questionsWithExplanations) {
        try {
            const contentData = {
                title: `Question ${question.questionNumber} - ${question.subDomain}`,
                originalText: question.explanation,
                metadata: {
                    source: 'quiz-explanation',
                    questionNumber: question.questionNumber.toString(),
                    examNumber,
                    correctAnswer: question.correctAnswer,
                    subDomain: question.subDomain,
                    questionText: question.questionText
                }
            };

            const contentItem = await exports.addContentToCollection(collection._id, contentData);
            importedContent.push(contentItem);
        } catch (error) {
            logger.error('Failed to import question explanation', { 
                questionNumber: question.questionNumber,
                error: error.message 
            });
        }
    }

    logger.info('Quiz explanations imported successfully', { 
        userId, 
        examNumber,
        collectionId: collection._id,
        importedCount: importedContent.length 
    });

    return {
        collection,
        importedContent,
        totalImported: importedContent.length
    };
};

/**
 * Get content item with all deletion levels
 * @param {string} contentId - The content item ID
 * @returns {Promise<object>} - Content item with deletion levels
 */
exports.getContentWithLevels = async (contentId) => {
    logger.info('Fetching content with deletion levels', { contentId });

    const content = await MemorizationContent.findById(contentId)
        .populate('collectionId', 'name category');

    if (!content) {
        throw new Error('Content not found');
    }

    logger.info('Content fetched successfully', { 
        contentId, 
        levelsCount: content.deletionLevels.length 
    });
    
    return content;
};

/**
 * Update content item
 * @param {string} contentId - The content item ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated content item
 */
exports.updateContent = async (contentId, updateData) => {
    logger.info('Updating content item', { contentId });

    const content = await MemorizationContent.findByIdAndUpdate(
        contentId,
        updateData,
        { new: true }
    );

    if (!content) {
        throw new Error('Content not found');
    }

    logger.info('Content updated successfully', { contentId });
    
    return content;
};

/**
 * Delete content item from collection
 * @param {string} contentId - The content item ID
 * @returns {Promise<boolean>} - Success status
 */
exports.deleteContent = async (contentId) => {
    logger.info('Deleting content item', { contentId });

    const content = await MemorizationContent.findById(contentId);
    if (!content) {
        throw new Error('Content not found');
    }

    const collectionId = content.collectionId;

    // Remove content
    await MemorizationContent.findByIdAndDelete(contentId);

    // Update collection
    await MemorizationCollection.findByIdAndUpdate(
        collectionId,
        {
            $pull: { contentItems: contentId },
            $inc: { totalItems: -1 },
            $set: { updatedAt: new Date() }
        }
    );

    logger.info('Content deleted successfully', { contentId, collectionId });
    
    return true;
};

/**
 * Delete entire collection and all its content
 * @param {string} collectionId - The collection ID
 * @param {string} userId - The user ID (for authorization)
 * @returns {Promise<boolean>} - Success status
 */
exports.deleteCollection = async (collectionId, userId) => {
    logger.info('Deleting collection', { collectionId, userId });

    const collection = await MemorizationCollection.findOne({ 
        _id: collectionId, 
        userId 
    });

    if (!collection) {
        throw new Error('Collection not found or unauthorized');
    }

    // Delete all content items in the collection
    await MemorizationContent.deleteMany({ collectionId });

    // Delete the collection
    await MemorizationCollection.findByIdAndDelete(collectionId);

    logger.info('Collection and all content deleted successfully', { 
        collectionId, 
        userId,
        deletedItems: collection.totalItems 
    });
    
    return true;
};