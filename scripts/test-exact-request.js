#!/usr/bin/env node

/**
 * Test the exact request that should be coming from the iPad
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Import the startQuiz function directly
async function simulateStartQuiz(db, userId, filters) {
  console.log('🔄 Simulating startQuiz function directly...');
  
  try {
    // Validate filters
    if (!filters.examNumber || !filters.examName) {
      throw new Error('examNumber and examName are required');
    }
    
    if (!filters.states || filters.states.length === 0) {
      throw new Error('At least one state filter is required');
    }
    
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Build match criteria
    const matchCriteria = { examNumber: filters.examNumber };
    if (filters.subDomain) {
      matchCriteria.subDomainNum = filters.subDomain;
    }
    
    console.log('📋 Match criteria:', matchCriteria);
    
    // Get mastered question IDs to exclude
    const masteredQuestions = await userProgress.find({
      userId,
      state: 'MASTERED'
    }).toArray();
    
    const masteredIds = masteredQuestions.map(p => p.questionId);
    if (masteredIds.length > 0) {
      matchCriteria._id = { $nin: masteredIds };
    }
    
    console.log(`🚫 Mastered questions to exclude: ${masteredIds.length}`);
    
    // Get user progress for state filtering
    const progressMap = new Map();
    const userProgressDocs = await userProgress.find({ userId }).toArray();
    userProgressDocs.forEach(p => {
      progressMap.set(p.questionId.toString(), p);
    });
    
    console.log(`📈 Total user progress records: ${userProgressDocs.length}`);
    
    // Fetch all matching questions
    const allQuestions = await questions.find(matchCriteria).toArray();
    console.log(`📚 Questions matching criteria: ${allQuestions.length}`);
    
    // Filter by state
    const filteredQuestions = allQuestions.filter(q => {
      const qId = q._id.toString();
      const progress = progressMap.get(qId);
      
      if (!progress) {
        // No progress = NEW
        return filters.states.includes('NEW');
      }
      
      // Check for EVER_WRONG filter
      if (filters.states.includes('EVER_WRONG') && progress.wrongCount > 0) {
        return true;
      }
      
      // Check for regular state filters
      return filters.states.includes(progress.state);
    });
    
    console.log(`✅ Final filtered questions: ${filteredQuestions.length}`);
    
    if (filteredQuestions.length === 0) {
      console.log('❌ Would throw NotFoundError: No questions match the selected filters');
      
      // Debug the filtering
      console.log('\n🔍 Debugging filter logic:');
      let newCount = 0;
      let everWrongCount = 0;
      let stateMatchCount = 0;
      
      allQuestions.forEach(q => {
        const qId = q._id.toString();
        const progress = progressMap.get(qId);
        
        if (!progress) {
          newCount++;
          if (filters.states.includes('NEW')) {
            console.log(`   NEW question would match: ${qId}`);
          }
        } else {
          if (filters.states.includes('EVER_WRONG') && progress.wrongCount > 0) {
            everWrongCount++;
            console.log(`   EVER_WRONG question: ${qId}, wrongCount: ${progress.wrongCount}, state: ${progress.state}`);
          }
          if (filters.states.includes(progress.state)) {
            stateMatchCount++;
          }
        }
      });
      
      console.log(`   Questions with no progress (NEW): ${newCount}`);
      console.log(`   Questions with wrongCount > 0 (EVER_WRONG): ${everWrongCount}`);
      console.log(`   Questions matching state filters: ${stateMatchCount}`);
      
      return null;
    }
    
    console.log(`✅ Would succeed with ${filteredQuestions.length} questions`);
    return { success: true, questionCount: filteredQuestions.length };
    
  } catch (error) {
    console.log(`❌ Would throw error: ${error.message}`);
    return null;
  }
}

async function testExactRequest() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Testing Exact iPad Request');
    console.log('============================');
    
    // Test with the iPad user
    const userId = '84984478-40b1-703d-53d0-aef7aad3a874';
    
    // Exact request that should be coming from iPad
    const filters = {
      examNumber: 'ISACA-AAIA',
      examName: 'ISACA AAIA (AI Audit, Assurance and Risk)',
      subDomain: '1',  // Domain 1 as string
      states: ['EVER_WRONG'],
      maxQuestions: 10
    };
    
    console.log('👤 User ID:', userId);
    console.log('📋 Filters:', JSON.stringify(filters, null, 2));
    
    const result = await simulateStartQuiz(db, userId, filters);
    
    if (result) {
      console.log(`\n✅ SUCCESS: Quiz would start with ${result.questionCount} questions`);
    } else {
      console.log(`\n❌ FAILURE: Quiz would fail to start`);
    }
    
    // Also test with "All Subdomains" to see if that works
    console.log('\n🔄 Testing with "All Subdomains":');
    const filtersAllDomains = {
      ...filters,
      subDomain: undefined  // All subdomains
    };
    
    const resultAll = await simulateStartQuiz(db, userId, filtersAllDomains);
    
    if (resultAll) {
      console.log(`✅ All Subdomains would work with ${resultAll.questionCount} questions`);
    } else {
      console.log(`❌ All Subdomains would also fail`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testExactRequest().catch(console.error);