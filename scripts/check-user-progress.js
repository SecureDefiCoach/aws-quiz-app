#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkUserProgress() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to database for user progress check...\n');
    
    const db = client.db('aws-quiz-db');
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Get all ISACA-AAIA questions in domain 1
    const isacaQuestions = await questions.find({
      examNumber: 'ISACA-AAIA',
      subDomainNum: '1'
    }).toArray();
    
    console.log(`📊 ISACA-AAIA Domain 1 Questions: ${isacaQuestions.length}`);
    
    // Get all user progress records
    const allProgress = await userProgress.find({}).toArray();
    console.log(`📊 Total User Progress Records: ${allProgress.length}`);
    
    // Check for ISACA-AAIA progress
    const isacaProgress = allProgress.filter(p => {
      const questionId = p.questionId.toString();
      return isacaQuestions.some(q => q._id.toString() === questionId);
    });
    
    console.log(`📊 ISACA-AAIA Progress Records: ${isacaProgress.length}`);
    
    // Check for questions with wrongCount > 0
    const wrongCountProgress = isacaProgress.filter(p => p.wrongCount > 0);
    console.log(`📊 ISACA-AAIA Questions with wrongCount > 0: ${wrongCountProgress.length}`);
    
    if (wrongCountProgress.length > 0) {
      console.log('\n🔍 Questions with wrongCount > 0:');
      wrongCountProgress.forEach(p => {
        console.log(`   - Question ID: ${p.questionId}`);
        console.log(`     State: ${p.state}`);
        console.log(`     Right: ${p.rightCount}, Wrong: ${p.wrongCount}`);
        console.log('');
      });
    }
    
    // Check all users
    const uniqueUsers = [...new Set(allProgress.map(p => p.userId))];
    console.log(`📊 Unique Users with Progress: ${uniqueUsers.length}`);
    uniqueUsers.forEach(userId => {
      const userProgressCount = allProgress.filter(p => p.userId === userId).length;
      const userWrongCount = allProgress.filter(p => p.userId === userId && p.wrongCount > 0).length;
      console.log(`   - User ${userId}: ${userProgressCount} progress records, ${userWrongCount} with wrongCount > 0`);
    });
    
    console.log('\n✅ User progress check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUserProgress();