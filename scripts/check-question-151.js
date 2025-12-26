#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkQuestion151() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('🔍 Checking Question 151...\n');
    
    const db = client.db('aws-quiz-db');
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Find question 151 (could be originalNumber or rowNum)
    const question151 = await questions.findOne({
      $or: [
        { originalNumber: '151' },
        { originalNumber: 151 },
        { rowNum: 151 }
      ]
    });
    
    if (!question151) {
      console.log('❌ Question 151 not found');
      
      // Let's see what questions exist with similar numbers
      const similarQuestions = await questions.find({
        $or: [
          { originalNumber: { $regex: '151' } },
          { rowNum: { $gte: 150, $lte: 152 } }
        ]
      }).toArray();
      
      console.log(`\n🔍 Found ${similarQuestions.length} questions with similar numbers:`);
      similarQuestions.forEach(q => {
        console.log(`   - ID: ${q._id}`);
        console.log(`     Original: ${q.originalNumber}, Row: ${q.rowNum}`);
        console.log(`     Exam: ${q.examNumber}, Domain: ${q.subDomainNum}`);
        console.log(`     Question: ${q.questionText.substring(0, 80)}...`);
        console.log('');
      });
      
      return;
    }
    
    console.log('✅ Found Question 151:');
    console.log(`   - ID: ${question151._id}`);
    console.log(`   - Original Number: ${question151.originalNumber}`);
    console.log(`   - Row Number: ${question151.rowNum}`);
    console.log(`   - Exam: ${question151.examNumber} (${question151.examName})`);
    console.log(`   - Domain: ${question151.subDomainNum} - ${question151.subDomain}`);
    console.log(`   - Question: ${question151.questionText.substring(0, 100)}...`);
    console.log('');
    
    // Find all user progress for this question
    const progressRecords = await userProgress.find({
      questionId: question151._id
    }).toArray();
    
    console.log(`📊 Progress Records for Question 151: ${progressRecords.length}`);
    
    if (progressRecords.length === 0) {
      console.log('❌ No progress records found for Question 151');
    } else {
      console.log('\n🔍 Progress Details:');
      progressRecords.forEach(p => {
        console.log(`   - User: ${p.userId}`);
        console.log(`     State: ${p.state}`);
        console.log(`     Right: ${p.rightCount}, Wrong: ${p.wrongCount}`);
        console.log(`     Attempts: ${p.attemptCount}`);
        console.log(`     Last Update: ${p.lastUpdateDate}`);
        console.log('');
      });
    }
    
    console.log('✅ Question 151 check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkQuestion151();