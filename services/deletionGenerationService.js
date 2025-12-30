// services/deletionGenerationService.js - Adaptive deletion algorithm for progressive memorization

const MemorizationContent = require('../models/MemorizationContent');
const { logger } = require('../utils/logger');

/**
 * Generate 15 deletion levels for a given text using adaptive algorithm
 * @param {string} text - The original text to create deletion levels for
 * @returns {Promise<Array>} - Array of 15 deletion levels
 */
exports.generateDeletionLevels = async (text) => {
    logger.info('Generating deletion levels', { textLength: text.length });

    const words = text.trim().split(/\s+/);
    const totalWords = words.length;

    if (totalWords < 5) {
        throw new Error('Text must have at least 5 words for deletion generation');
    }

    // Prioritize key terms for early deletion
    const keyTermIndices = exports.prioritizeKeyTerms(words);
    
    const deletionLevels = [];
    let cumulativeDeletedIndices = new Set();

    for (let level = 1; level <= 15; level++) {
        const deletionCount = exports.calculateDeletionCount(level, totalWords);
        
        // For level 1, no deletions (full text)
        if (level === 1) {
            deletionLevels.push({
                level: 1,
                text: text,
                deletedWords: [],
                deletionCount: 0,
                deletionPercentage: 0
            });
            continue;
        }

        // Calculate how many new words to delete this level
        const newDeletionsNeeded = deletionCount - cumulativeDeletedIndices.size;
        
        if (newDeletionsNeeded > 0) {
            // Select words to delete, prioritizing key terms
            const newDeletions = exports.selectWordsToDelete(
                words, 
                keyTermIndices, 
                cumulativeDeletedIndices, 
                newDeletionsNeeded
            );
            
            // Add new deletions to cumulative set
            newDeletions.forEach(index => cumulativeDeletedIndices.add(index));
        }

        // Generate the text with blanks
        const { modifiedText, deletedWords } = exports.generateTextWithBlanks(
            words, 
            cumulativeDeletedIndices
        );

        deletionLevels.push({
            level,
            text: modifiedText,
            deletedWords,
            deletionCount: cumulativeDeletedIndices.size,
            deletionPercentage: Math.round((cumulativeDeletedIndices.size / totalWords) * 100)
        });
    }

    logger.info('Deletion levels generated successfully', { 
        totalWords, 
        levels: deletionLevels.length,
        maxDeletionPercentage: deletionLevels[14].deletionPercentage 
    });

    return deletionLevels;
};
/**
 * Calculate deletion count using adaptive formula
 * Formula: Level N removes = min(1, N) + floor(totalWords × (N × 0.04))
 * Capped at 85% of total words for readability
 * @param {number} level - The deletion level (1-15)
 * @param {number} totalWords - Total number of words in the text
 * @returns {number} - Number of words to delete at this level
 */
exports.calculateDeletionCount = (level, totalWords) => {
    if (level === 1) return 0; // Full text at level 1
    
    const baseCount = Math.min(1, level);
    const scaledCount = Math.floor(totalWords * (level * 0.04));
    const totalDeletion = baseCount + scaledCount;
    
    // Cap at 85% of total words for readability
    const maxDeletion = Math.floor(totalWords * 0.85);
    
    return Math.min(totalDeletion, maxDeletion);
};

/**
 * Prioritize key terms for deletion (technical terms, important concepts)
 * @param {Array} words - Array of words in the text
 * @returns {Array} - Array of indices sorted by priority (key terms first)
 */
exports.prioritizeKeyTerms = (words) => {
    const keyTermPatterns = [
        // Technical terms
        /^[A-Z]{2,}$/, // Acronyms (AWS, API, etc.)
        /^[A-Z][a-z]*[A-Z]/, // CamelCase terms
        /^[a-z]+[A-Z]/, // camelCase terms
        // Important concepts
        /security|authentication|authorization|encryption|compliance/i,
        /database|storage|compute|network|monitoring/i,
        /policy|role|permission|access|identity/i,
        // Common technical words
        /service|resource|configuration|deployment|management/i
    ];

    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    const wordPriorities = words.map((word, index) => {
        let priority = 0;
        const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
        
        // Skip very short words and common words
        if (cleanWord.length <= 2 || commonWords.has(cleanWord)) {
            priority = -1; // Low priority
        } else {
            // Check against key term patterns
            for (const pattern of keyTermPatterns) {
                if (pattern.test(word)) {
                    priority = 2; // High priority
                    break;
                }
            }
            
            // Medium priority for other words
            if (priority === 0) {
                priority = 1;
            }
        }
        
        return { index, word, priority };
    });

    // Sort by priority (high to low), then by position for stability
    return wordPriorities
        .sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // High priority first
            }
            return a.index - b.index; // Maintain original order for same priority
        })
        .map(item => item.index);
};

/**
 * Select words to delete based on priority and current deletions
 * @param {Array} words - Array of words
 * @param {Array} keyTermIndices - Prioritized word indices
 * @param {Set} alreadyDeleted - Set of already deleted word indices
 * @param {number} count - Number of words to select for deletion
 * @returns {Array} - Array of word indices to delete
 */
exports.selectWordsToDelete = (words, keyTermIndices, alreadyDeleted, count) => {
    const availableIndices = keyTermIndices.filter(index => !alreadyDeleted.has(index));
    
    if (availableIndices.length < count) {
        // If we don't have enough prioritized words, add remaining words
        const allIndices = Array.from({ length: words.length }, (_, i) => i);
        const remainingIndices = allIndices.filter(index => 
            !alreadyDeleted.has(index) && !availableIndices.includes(index)
        );
        
        return [...availableIndices, ...remainingIndices.slice(0, count - availableIndices.length)];
    }
    
    return availableIndices.slice(0, count);
};
/**
 * Generate text with blanks for deleted words
 * @param {Array} words - Array of original words
 * @param {Set} deletedIndices - Set of indices to replace with blanks
 * @returns {object} - Object with modifiedText and deletedWords array
 */
exports.generateTextWithBlanks = (words, deletedIndices) => {
    const deletedWords = [];
    
    const modifiedWords = words.map((word, index) => {
        if (deletedIndices.has(index)) {
            // Determine if this word is a key term
            const isKeyTerm = exports.isKeyTerm(word);
            
            deletedWords.push({
                position: index,
                originalWord: word,
                isKeyTerm
            });
            
            // Replace with blank of appropriate length
            const blankLength = Math.max(3, Math.min(word.length, 8));
            return '_'.repeat(blankLength);
        }
        return word;
    });
    
    return {
        modifiedText: modifiedWords.join(' '),
        deletedWords
    };
};

/**
 * Check if a word is considered a key term
 * @param {string} word - The word to check
 * @returns {boolean} - True if the word is a key term
 */
exports.isKeyTerm = (word) => {
    const keyTermPatterns = [
        /^[A-Z]{2,}$/, // Acronyms
        /^[A-Z][a-z]*[A-Z]/, // CamelCase
        /^[a-z]+[A-Z]/, // camelCase
        /security|authentication|authorization|encryption|compliance/i,
        /database|storage|compute|network|monitoring/i,
        /policy|role|permission|access|identity/i,
        /service|resource|configuration|deployment|management/i
    ];
    
    return keyTermPatterns.some(pattern => pattern.test(word));
};

/**
 * Validate that the deletion maintains readability
 * @param {string} text - The text with deletions
 * @param {number} deletionPercentage - Percentage of words deleted
 * @returns {boolean} - True if text maintains readability
 */
exports.validateReadability = (text, deletionPercentage) => {
    // Basic readability checks
    if (deletionPercentage > 85) {
        return false; // Too many deletions
    }
    
    // Check that we still have some complete sentences
    const sentences = text.split(/[.!?]+/);
    const completeSentences = sentences.filter(sentence => 
        sentence.trim().length > 0 && 
        !sentence.includes('_____') || 
        sentence.split('_____').length <= 3 // Max 2 blanks per sentence
    );
    
    return completeSentences.length > 0;
};

/**
 * Apply deletion levels to a content item and save to database
 * @param {string} contentId - The content item ID
 * @returns {Promise<object>} - Updated content item with deletion levels
 */
exports.applyDeletionLevels = async (contentId) => {
    logger.info('Applying deletion levels to content', { contentId });
    
    const content = await MemorizationContent.findById(contentId);
    if (!content) {
        throw new Error('Content not found');
    }
    
    if (content.deletionLevels && content.deletionLevels.length === 15) {
        logger.info('Content already has deletion levels', { contentId });
        return content;
    }
    
    const deletionLevels = await exports.generateDeletionLevels(content.originalText);
    
    content.deletionLevels = deletionLevels;
    await content.save();
    
    logger.info('Deletion levels applied successfully', { 
        contentId, 
        levels: deletionLevels.length,
        wordCount: content.wordCount 
    });
    
    return content;
};