#!/usr/bin/env node

/**
 * Check which user is currently authenticated and their progress
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkCurrentUser() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Checking User Authentication and Progress');
    console.log('==========================================');
    
    // Get all users with progress
    const userProgress = db.collection('userProgress');
    const users = await userProgress.distinct('userId');
    
    console.log(`\n📊 All users with progress:`);
    
    for (const userId of users) {
      console.log(`\n👤 User ID: ${userId}`);
      
      // Get total progress records
      const totalProgress = await userProgress.countDocuments({ userId });
      console.log(`  📈 Total progress records: ${totalProgress}`);
      
      // Get ISACA-AAIA progress
      const questions = db.collection('questions');
      const isaacQuestions = await questions.find({ examNumber: 'ISACA-AAIA' }).toArray();
      const isaacQuestionIds = isaacQuestions.map(q => q._id);
      
      const isaacProgress = await userProgress.find({
        userId,
        questionId: { $in: isaacQuestionIds }
      }).toArray();
      
      console.log(`  📚 ISACA-AAIA progress records: ${isaacProgress.length}`);
      
      // Count Ever Wrong questions
      const everWrong = isaacProgress.filter(p => p.wrongCount > 0);
      console.log(`  ❌ ISACA-AAIA Ever Wrong questions: ${everWrong.length}`);
      
      // Check if this matches the email we're looking for
      if (userId.includes('94c8f4e8') || isaacProgress.length === 0) {
        console.log(`  🎯 This might be the current user (aemjk4h@protonmail.com)`);
        console.log(`  ⚠️  This user has NO ISACA-AAIA progress, explaining the Ever Wrong filter failure`);
      }
      
      if (isaacProgress.length > 0) {
        console.log(`  ✅ This user has ISACA-AAIA progress and could use Ever Wrong filter`);
      }
    }
    
    console.log(`\n💡 SOLUTION:`);
    console.log(`   The user needs to answer some ISACA-AAIA questions incorrectly first`);
    console.log(`   before the "Ever Wrong" filter will have any questions to show.`);
    console.log(`   Alternatively, they can select other states like "NEW" or "WRONG".`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkCurrentUser().catch(console.error);