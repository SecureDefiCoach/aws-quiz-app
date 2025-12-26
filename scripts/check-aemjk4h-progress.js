#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkAemjk4hProgress() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('🔍 Checking progress for aemjk4h@protonmail.com...\n');
    
    const db = client.db('aws-quiz-db');
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Get all progress records and find the user by examining their data
    const allProgress = await userProgress.find({}).toArray();
    console.log(`📊 Total Progress Records: ${allProgress.length}`);
    
    // Group by user ID
    const userGroups = {};
    allProgress.forEach(p => {
      if (!userGroups[p.userId]) {
        userGroups[p.userId] = [];
      }
      userGroups[p.userId].push(p);
    });
    
    console.log(`👥 Unique Users: ${Object.keys(userGroups).length}\n`);
    
    // Show each user's exam breakdown to help identify which is aemjk4h
    for (const [userId, records] of Object.entries(userGroups)) {
      console.log(`👤 User: ${userId}`);
      console.log(`   📊 Total Records: ${records.length}`);
      
      // Count by exam
      const examCounts = {};
      const wrongRecords = records.filter(r => r.wrongCount > 0);
      
      // Sample a few questions to see exam breakdown
      const sampleQuestions = await questions.find({
        _id: { $in: records.slice(0, 10).map(r => r.questionId) }
      }).toArray();
      
      sampleQuestions.forEach(q => {
        const exam = q.examNumber;
        if (!examCounts[exam]) examCounts[exam] = 0;
        examCounts[exam]++;
      });
      
      console.log(`   📋 Sample Exam Breakdown:`);
      for (const [exam, count] of Object.entries(examCounts)) {
        console.log(`      ${exam}: ${count}+ questions`);
      }
      
      console.log(`   ❌ Questions with wrongCount > 0: ${wrongRecords.length}`);
      console.log('');
    }
    
    // Now let's specifically look for ISACA-AAIA progress
    console.log('🔍 Looking for ISACA-AAIA progress...\n');
    
    const isacaQuestions = await questions.find({
      examNumber: 'ISACA-AAIA'
    }).toArray();
    
    console.log(`📝 Total ISACA-AAIA Questions: ${isacaQuestions.length}`);
    
    const isacaQuestionIds = isacaQuestions.map(q => q._id.toString());
    
    // Find progress records for ISACA questions
    const isacaProgress = allProgress.filter(p => 
      isacaQuestionIds.includes(p.questionId.toString())
    );
    
    console.log(`📊 ISACA-AAIA Progress Records: ${isacaProgress.length}`);
    
    if (isacaProgress.length > 0) {
      // Group ISACA progress by user
      const isacaUserGroups = {};
      isacaProgress.forEach(p => {
        if (!isacaUserGroups[p.userId]) {
          isacaUserGroups[p.userId] = [];
        }
        isacaUserGroups[p.userId].push(p);
      });
      
      console.log('\n🎯 ISACA-AAIA Progress by User:');
      for (const [userId, records] of Object.entries(isacaUserGroups)) {
        const wrongRecords = records.filter(r => r.wrongCount > 0);
        console.log(`   👤 User ${userId}:`);
        console.log(`      📊 ISACA Records: ${records.length}`);
        console.log(`      ❌ With wrongCount > 0: ${wrongRecords.length}`);
        
        if (wrongRecords.length > 0) {
          console.log(`      🔍 Sample wrong answers:`);
          for (let i = 0; i < Math.min(3, wrongRecords.length); i++) {
            const record = wrongRecords[i];
            const question = isacaQuestions.find(q => q._id.toString() === record.questionId.toString());
            if (question) {
              console.log(`         - Q${question.originalNumber || 'N/A'} Domain ${question.subDomainNum}: Right=${record.rightCount}, Wrong=${record.wrongCount}`);
            }
          }
        }
        console.log('');
      }
    }
    
    console.log('✅ Progress check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkAemjk4hProgress();