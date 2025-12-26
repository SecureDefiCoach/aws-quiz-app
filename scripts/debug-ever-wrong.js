#!/usr/bin/env node

/**
 * Debug script to test Ever Wrong filter functionality
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugEverWrong() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Debugging Ever Wrong Filter');
    console.log('================================');
    
    // Test with ISACA-AAIA exam
    const examNumber = 'ISACA-AAIA';
    
    // Get all users with progress
    const userProgress = db.collection('userProgress');
    const users = await userProgress.distinct('userId');
    
    console.log(`\n📊 Found ${users.length} users with progress:`);
    users.forEach((userId, index) => {
      console.log(`  ${index + 1}. ${userId}`);
    });
    
    // For each user, check their EVER_WRONG questions for ISACA-AAIA
    for (const userId of users) {
      console.log(`\n👤 User: ${userId}`);
      
      // Get questions for this exam
      const questions = db.collection('questions');
      const examQuestions = await questions.find({ examNumber }).toArray();
      console.log(`  📚 Total ${examNumber} questions: ${examQuestions.length}`);
      
      // Get user progress for this exam
      const questionIds = examQuestions.map(q => q._id);
      const progressRecords = await userProgress.find({
        userId,
        questionId: { $in: questionIds }
      }).toArray();
      
      console.log(`  📈 User progress records for ${examNumber}: ${progressRecords.length}`);
      
      // Count EVER_WRONG questions (wrongCount > 0)
      const everWrongQuestions = progressRecords.filter(p => p.wrongCount > 0);
      console.log(`  ❌ Ever Wrong questions: ${everWrongQuestions.length}`);
      
      if (everWrongQuestions.length > 0) {
        console.log(`  📝 Sample Ever Wrong questions:`);
        everWrongQuestions.slice(0, 3).forEach((p, index) => {
          console.log(`    ${index + 1}. Question ID: ${p.questionId}, Wrong Count: ${p.wrongCount}, State: ${p.state}`);
        });
      }
      
      // Now simulate the startQuiz filter logic
      console.log(`\n  🔍 Simulating startQuiz filter logic:`);
      
      // Build match criteria (same as in startQuiz)
      const matchCriteria = { examNumber };
      
      // Get mastered question IDs to exclude
      const masteredQuestions = await userProgress.find({
        userId,
        state: 'MASTERED'
      }).toArray();
      
      const masteredIds = masteredQuestions.map(p => p.questionId);
      if (masteredIds.length > 0) {
        matchCriteria._id = { $nin: masteredIds };
      }
      
      console.log(`    🚫 Excluding ${masteredIds.length} mastered questions`);
      
      // Get user progress for state filtering
      const progressMap = new Map();
      const userProgressDocs = await userProgress.find({ userId }).toArray();
      userProgressDocs.forEach(p => {
        progressMap.set(p.questionId.toString(), p);
      });
      
      // Fetch all matching questions
      const allQuestions = await questions.find(matchCriteria).toArray();
      console.log(`    📚 Questions after mastered exclusion: ${allQuestions.length}`);
      
      // Filter by EVER_WRONG state
      const states = ['EVER_WRONG'];
      const filteredQuestions = allQuestions.filter(q => {
        const qId = q._id.toString();
        const progress = progressMap.get(qId);
        
        if (!progress) {
          // No progress = NEW
          return states.includes('NEW');
        }
        
        // Check for EVER_WRONG filter
        if (states.includes('EVER_WRONG') && progress.wrongCount > 0) {
          return true;
        }
        
        // Check for regular state filters
        return states.includes(progress.state);
      });
      
      console.log(`    ✅ Questions matching EVER_WRONG filter: ${filteredQuestions.length}`);
      
      if (filteredQuestions.length === 0) {
        console.log(`    ⚠️  NO QUESTIONS FOUND - This would cause "Failed to start quiz" error`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugEverWrong().catch(console.error);