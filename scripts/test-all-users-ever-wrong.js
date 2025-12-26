#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testAllUsersEverWrong() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('🧪 Testing EVER_WRONG filter for all users...\n');
    
    const db = client.db('aws-quiz-db');
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    const filters = {
      examNumber: 'ISACA-AAIA',
      subDomain: '1',
      states: ['EVER_WRONG']
    };
    
    const userIds = [
      '94c8f4e8-8091-7016-8a4c-eac76ff5ea36',
      '7428b478-b061-701d-339d-d12b31d2d13a', 
      '84984478-40b1-703d-53d0-aef7aad3a874'
    ];
    
    console.log(`🎯 Testing filters:`, filters);
    console.log('');
    
    for (const userId of userIds) {
      console.log(`👤 Testing User: ${userId}`);
      
      // Build match criteria
      const matchCriteria = { examNumber: filters.examNumber };
      if (filters.subDomain) {
        matchCriteria.subDomainNum = filters.subDomain;
      }
      
      // Get mastered questions to exclude
      const masteredQuestions = await userProgress.find({
        userId,
        state: 'MASTERED'
      }).toArray();
      
      const masteredIds = masteredQuestions.map(p => p.questionId);
      if (masteredIds.length > 0) {
        matchCriteria._id = { $nin: masteredIds };
      }
      
      // Get user progress
      const userProgressDocs = await userProgress.find({ userId }).toArray();
      const progressMap = new Map();
      userProgressDocs.forEach(p => {
        progressMap.set(p.questionId.toString(), p);
      });
      
      // Get all matching questions
      const allQuestions = await questions.find(matchCriteria).toArray();
      
      // Filter by EVER_WRONG
      const filteredQuestions = allQuestions.filter(q => {
        const qId = q._id.toString();
        const progress = progressMap.get(qId);
        
        if (!progress) {
          return false; // No progress, not EVER_WRONG
        }
        
        // Check for EVER_WRONG filter
        return progress.wrongCount > 0;
      });
      
      console.log(`   📊 Total Progress: ${userProgressDocs.length}`);
      console.log(`   📝 ISACA Domain 1 Questions: ${allQuestions.length}`);
      console.log(`   ✅ EVER_WRONG Matches: ${filteredQuestions.length}`);
      
      if (filteredQuestions.length > 0) {
        console.log(`   🎯 This user should be able to start EVER_WRONG quiz!`);
        
        // Show sample questions
        console.log(`   🔍 Sample questions:`);
        filteredQuestions.slice(0, 3).forEach(q => {
          const progress = progressMap.get(q._id.toString());
          console.log(`      - Right=${progress?.rightCount || 0}, Wrong=${progress?.wrongCount || 0}`);
        });
      } else {
        console.log(`   ❌ This user has no EVER_WRONG questions for ISACA Domain 1`);
      }
      
      console.log('');
    }
    
    console.log('✅ All users tested!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testAllUsersEverWrong();