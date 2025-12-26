#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findYourProgress() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('🔍 Finding your progress records...\n');
    
    const db = client.db('aws-quiz-db');
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Get all progress records
    const allProgress = await userProgress.find({}).toArray();
    console.log(`📊 Total Progress Records: ${allProgress.length}`);
    
    // Group by user
    const userGroups = {};
    allProgress.forEach(p => {
      if (!userGroups[p.userId]) {
        userGroups[p.userId] = [];
      }
      userGroups[p.userId].push(p);
    });
    
    console.log(`👥 Unique Users: ${Object.keys(userGroups).length}\n`);
    
    // Show each user's progress
    for (const [userId, records] of Object.entries(userGroups)) {
      console.log(`👤 User: ${userId}`);
      console.log(`   📊 Total Records: ${records.length}`);
      
      // Count by exam
      const examCounts = {};
      const wrongRecords = records.filter(r => r.wrongCount > 0);
      
      for (const record of records) {
        // Get the question to find exam
        const question = await questions.findOne({ _id: record.questionId });
        if (question) {
          const exam = question.examNumber;
          if (!examCounts[exam]) examCounts[exam] = 0;
          examCounts[exam]++;
        }
      }
      
      console.log(`   📋 By Exam:`);
      for (const [exam, count] of Object.entries(examCounts)) {
        console.log(`      ${exam}: ${count} questions`);
      }
      
      console.log(`   ❌ Questions with wrongCount > 0: ${wrongRecords.length}`);
      
      // Show some wrong answers
      if (wrongRecords.length > 0) {
        console.log(`   🔍 Sample wrong answers:`);
        for (let i = 0; i < Math.min(3, wrongRecords.length); i++) {
          const record = wrongRecords[i];
          const question = await questions.findOne({ _id: record.questionId });
          if (question) {
            console.log(`      - ${question.examNumber} Q${question.originalNumber || 'N/A'}: Right=${record.rightCount}, Wrong=${record.wrongCount}`);
            console.log(`        ${question.questionText.substring(0, 60)}...`);
          }
        }
      }
      
      console.log('');
    }
    
    console.log('✅ Progress analysis completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findYourProgress();