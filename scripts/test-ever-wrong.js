#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testEverWrongFilter() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('🧪 Testing EVER_WRONG filter for ISACA-AAIA Domain 1...\n');
    
    const db = client.db('aws-quiz-db');
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Simulate the exact filter conditions
    const filters = {
      examNumber: 'ISACA-AAIA',
      subDomain: '1',  // First domain
      states: ['EVER_WRONG']
    };
    
    // Use the user with the most ISACA progress (likely aemjk4h)
    const userId = '84984478-40b1-703d-53d0-aef7aad3a874';
    console.log(`👤 Testing for User: ${userId} (most ISACA progress)`);
    console.log(`📋 Filters:`, filters);
    console.log('');
    
    // Build match criteria (same as backend logic)
    const matchCriteria = { examNumber: filters.examNumber };
    if (filters.subDomain) {
      matchCriteria.subDomainNum = filters.subDomain;
    }
    
    console.log(`🔍 MongoDB Match Criteria:`, matchCriteria);
    
    // Get mastered question IDs to exclude
    const masteredQuestions = await userProgress.find({
      userId,
      state: 'MASTERED'
    }).toArray();
    
    console.log(`🏆 Mastered Questions: ${masteredQuestions.length}`);
    
    const masteredIds = masteredQuestions.map(p => p.questionId);
    if (masteredIds.length > 0) {
      matchCriteria._id = { $nin: masteredIds };
    }
    
    // Get user progress for state filtering
    const userProgressDocs = await userProgress.find({ userId }).toArray();
    const progressMap = new Map();
    userProgressDocs.forEach(p => {
      progressMap.set(p.questionId.toString(), p);
    });
    
    console.log(`📊 User Progress Records: ${userProgressDocs.length}`);
    
    // Fetch all matching questions
    const allQuestions = await questions.find(matchCriteria).toArray();
    console.log(`📝 Questions matching criteria: ${allQuestions.length}`);
    
    // Debug: Show some progress map keys
    console.log('🔍 Progress Map Keys (first 5):');
    const mapKeys = Array.from(progressMap.keys()).slice(0, 5);
    mapKeys.forEach(key => console.log(`   ${key}`));
    
    // Debug: Show some question IDs
    console.log('🔍 Question IDs (first 5):');
    allQuestions.slice(0, 5).forEach(q => console.log(`   ${q._id.toString()}`));
    
    // Filter by state (simulate backend logic)
    const filteredQuestions = allQuestions.filter(q => {
      const qId = q._id.toString();
      const progress = progressMap.get(qId);
      
      if (!progress) {
        // No progress = NEW
        const includesNew = filters.states.includes('NEW');
        console.log(`   Question ${qId}: No progress, NEW=${includesNew}`);
        return includesNew;
      }
      
      // Check for EVER_WRONG filter
      if (filters.states.includes('EVER_WRONG') && progress.wrongCount > 0) {
        console.log(`   Question ${qId}: EVER_WRONG match (wrongCount=${progress.wrongCount})`);
        return true;
      }
      
      // Check for regular state filters
      const includesState = filters.states.includes(progress.state);
      console.log(`   Question ${qId}: State=${progress.state}, included=${includesState}`);
      return includesState;
    });
    
    console.log(`\n✅ Filtered Questions: ${filteredQuestions.length}`);
    
    if (filteredQuestions.length === 0) {
      console.log('❌ NO QUESTIONS MATCH - This would cause "No questions match the specified filters" error');
    } else {
      console.log('✅ Questions found - Quiz should start successfully');
      
      // Show some details about the filtered questions
      console.log('\n🔍 Sample filtered questions:');
      filteredQuestions.slice(0, 3).forEach(q => {
        const progress = progressMap.get(q._id.toString());
        console.log(`   - ${q.questionText.substring(0, 50)}...`);
        console.log(`     Progress: Right=${progress?.rightCount || 0}, Wrong=${progress?.wrongCount || 0}, State=${progress?.state || 'NEW'}`);
      });
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testEverWrongFilter();