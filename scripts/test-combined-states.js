#!/usr/bin/env node

/**
 * Test what happens when we combine NEW and EVER_WRONG states
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testCombinedStates() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Testing Combined States (NEW + EVER_WRONG)');
    console.log('=============================================');
    
    const userId = '94c8f4e8-8091-7016-8a4c-eac76ff5ea36'; // The problematic user
    const examNumber = 'ISACA-AAIA';
    
    console.log(`👤 User: ${userId}`);
    console.log(`📚 Exam: ${examNumber}`);
    
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
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
    
    console.log(`🚫 Excluding ${masteredIds.length} mastered questions`);
    
    // Get user progress for state filtering
    const progressMap = new Map();
    const userProgressDocs = await userProgress.find({ userId }).toArray();
    userProgressDocs.forEach(p => {
      progressMap.set(p.questionId.toString(), p);
    });
    
    // Fetch all matching questions
    const allQuestions = await questions.find(matchCriteria).toArray();
    console.log(`📚 Total questions after mastered exclusion: ${allQuestions.length}`);
    
    // Test different state combinations
    const testCases = [
      { name: 'EVER_WRONG only', states: ['EVER_WRONG'] },
      { name: 'NEW only', states: ['NEW'] },
      { name: 'NEW + EVER_WRONG', states: ['NEW', 'EVER_WRONG'] },
      { name: 'NEW + WRONG', states: ['NEW', 'WRONG'] },
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log(`   States: [${testCase.states.join(', ')}]`);
      
      const filteredQuestions = allQuestions.filter(q => {
        const qId = q._id.toString();
        const progress = progressMap.get(qId);
        
        if (!progress) {
          // No progress = NEW
          return testCase.states.includes('NEW');
        }
        
        // Check for EVER_WRONG filter
        if (testCase.states.includes('EVER_WRONG') && progress.wrongCount > 0) {
          return true;
        }
        
        // Check for regular state filters
        return testCase.states.includes(progress.state);
      });
      
      console.log(`   ✅ Matching questions: ${filteredQuestions.length}`);
      
      if (filteredQuestions.length === 0) {
        console.log(`   ❌ WOULD FAIL: "No questions match the selected filters"`);
      } else {
        console.log(`   ✅ WOULD SUCCEED: Quiz can start with ${filteredQuestions.length} questions`);
      }
    }
    
    console.log(`\n💡 RECOMMENDATION:`);
    console.log(`   User should select "NEW" + "EVER_WRONG" instead of just "EVER_WRONG"`);
    console.log(`   This will include all new questions plus any previously answered incorrectly`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testCombinedStates().catch(console.error);