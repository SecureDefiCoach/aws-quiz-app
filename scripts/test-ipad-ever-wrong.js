#!/usr/bin/env node

/**
 * Test the exact Ever Wrong scenario for the iPad user
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testIpadEverWrong() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Testing Ever Wrong Filter for iPad User');
    console.log('==========================================');
    
    const userId = '84984478-40b1-703d-53d0-aef7aad3a874'; // The iPad user
    const examNumber = 'ISACA-AAIA';
    
    console.log(`👤 iPad User: ${userId}`);
    console.log(`📚 Exam: ${examNumber}`);
    
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Simulate the exact startQuiz logic
    console.log(`\n🔄 Simulating startQuiz logic...`);
    
    // Build match criteria
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
    console.log(`📚 Questions after mastered exclusion: ${allQuestions.length}`);
    
    // Filter by EVER_WRONG state (exactly like in startQuiz)
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
    
    console.log(`✅ Questions matching EVER_WRONG filter: ${filteredQuestions.length}`);
    
    if (filteredQuestions.length === 0) {
      console.log(`❌ QUIZ WOULD FAIL: "No questions match the selected filters"`);
      
      // Debug: Let's see what's in the progress records
      console.log(`\n🔍 Debugging progress records:`);
      const isaacQuestions = await questions.find({ examNumber }).toArray();
      const isaacQuestionIds = isaacQuestions.map(q => q._id);
      const isaacProgress = await userProgress.find({
        userId,
        questionId: { $in: isaacQuestionIds }
      }).toArray();
      
      console.log(`📊 ISACA-AAIA progress records: ${isaacProgress.length}`);
      
      const wrongCountStats = {};
      isaacProgress.forEach(p => {
        const key = `wrongCount_${p.wrongCount}`;
        wrongCountStats[key] = (wrongCountStats[key] || 0) + 1;
      });
      
      console.log(`📊 Wrong count distribution:`);
      Object.entries(wrongCountStats).forEach(([key, count]) => {
        console.log(`  ${key}: ${count}`);
      });
      
      const everWrongQuestions = isaacProgress.filter(p => p.wrongCount > 0);
      console.log(`❌ Questions with wrongCount > 0: ${everWrongQuestions.length}`);
      
      if (everWrongQuestions.length > 0) {
        console.log(`📝 Sample Ever Wrong questions:`);
        everWrongQuestions.slice(0, 5).forEach((p, index) => {
          console.log(`  ${index + 1}. QuestionId: ${p.questionId}, wrongCount: ${p.wrongCount}, state: ${p.state}`);
        });
      }
      
    } else {
      console.log(`✅ QUIZ WOULD SUCCEED: ${filteredQuestions.length} questions available`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testIpadEverWrong().catch(console.error);