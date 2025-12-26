#!/usr/bin/env node

/**
 * Find the correct user ID for the iPad account with 178 ISACA-AAIA progress records
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findIpadUser() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Finding iPad User with 178 ISACA-AAIA Progress Records');
    console.log('======================================================');
    
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // Get all ISACA-AAIA questions
    const isaacQuestions = await questions.find({ examNumber: 'ISACA-AAIA' }).toArray();
    const isaacQuestionIds = isaacQuestions.map(q => q._id);
    
    console.log(`📚 Total ISACA-AAIA questions in database: ${isaacQuestions.length}`);
    
    // Get all users with progress
    const users = await userProgress.distinct('userId');
    console.log(`👥 Total users with progress: ${users.length}`);
    
    console.log(`\n🔍 Checking each user's ISACA-AAIA progress:`);
    
    for (const userId of users) {
      const isaacProgress = await userProgress.find({
        userId,
        questionId: { $in: isaacQuestionIds }
      }).toArray();
      
      console.log(`\n👤 User: ${userId}`);
      console.log(`  📈 ISACA-AAIA progress records: ${isaacProgress.length}`);
      
      if (isaacProgress.length === 178) {
        console.log(`  🎯 FOUND THE IPAD USER! This user has exactly 178 ISACA-AAIA records`);
        
        // Analyze the states
        const states = {};
        const everWrongCount = isaacProgress.filter(p => p.wrongCount > 0).length;
        
        isaacProgress.forEach(p => {
          states[p.state] = (states[p.state] || 0) + 1;
        });
        
        console.log(`  📊 State breakdown:`);
        Object.entries(states).forEach(([state, count]) => {
          console.log(`    ${state}: ${count}`);
        });
        
        console.log(`  ❌ Questions with wrongCount > 0 (Ever Wrong): ${everWrongCount}`);
        
        if (everWrongCount === 0) {
          console.log(`  ⚠️  NO EVER WRONG QUESTIONS - This explains the filter failure!`);
          console.log(`  💡 User answered all questions correctly on first try`);
        } else {
          console.log(`  ✅ Has Ever Wrong questions - filter should work`);
        }
        
        // Show some sample progress records
        console.log(`  📝 Sample progress records:`);
        isaacProgress.slice(0, 5).forEach((p, index) => {
          console.log(`    ${index + 1}. State: ${p.state}, Right: ${p.rightCount}, Wrong: ${p.wrongCount}`);
        });
      }
      
      if (isaacProgress.length > 0 && isaacProgress.length !== 178) {
        console.log(`  📊 Partial progress (${isaacProgress.length}/178)`);
      }
      
      if (isaacProgress.length === 0) {
        console.log(`  📊 No ISACA-AAIA progress`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findIpadUser().catch(console.error);