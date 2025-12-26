#!/usr/bin/env node

/**
 * Find all possible user IDs that could be associated with aemjk4h@protonmail.com
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findAllAemjk4hUsers() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Finding All Possible aemjk4h@protonmail.com User IDs');
    console.log('====================================================');
    
    const userProgress = db.collection('userProgress');
    const questions = db.collection('questions');
    
    // Get all users with progress
    const allUsers = await userProgress.distinct('userId');
    console.log(`👥 Total users with progress: ${allUsers.length}`);
    
    // Get ISACA-AAIA questions for reference
    const isaacQuestions = await questions.find({ examNumber: 'ISACA-AAIA' }).toArray();
    const isaacQuestionIds = isaacQuestions.map(q => q._id);
    
    console.log(`\n📊 Analyzing each user for ISACA-AAIA progress:`);
    
    const candidates = [];
    
    for (const userId of allUsers) {
      console.log(`\n👤 User: ${userId}`);
      
      // Get total progress
      const totalProgress = await userProgress.countDocuments({ userId });
      console.log(`  📈 Total progress records: ${totalProgress}`);
      
      // Get ISACA-AAIA progress
      const isaacProgress = await userProgress.find({
        userId,
        questionId: { $in: isaacQuestionIds }
      }).toArray();
      
      console.log(`  📚 ISACA-AAIA progress: ${isaacProgress.length}/178`);
      
      // Check Ever Wrong count
      const everWrongCount = isaacProgress.filter(p => p.wrongCount > 0).length;
      console.log(`  ❌ ISACA-AAIA Ever Wrong: ${everWrongCount}`);
      
      // Check states distribution
      const states = {};
      isaacProgress.forEach(p => {
        states[p.state] = (states[p.state] || 0) + 1;
      });
      
      if (Object.keys(states).length > 0) {
        console.log(`  📊 States:`, states);
      }
      
      // Determine if this could be the aemjk4h user
      let likelihood = 'Low';
      let reasons = [];
      
      if (isaacProgress.length === 178) {
        likelihood = 'HIGH';
        reasons.push('Has ALL 178 ISACA-AAIA questions answered');
      } else if (isaacProgress.length > 100) {
        likelihood = 'Medium';
        reasons.push(`Has ${isaacProgress.length}/178 ISACA-AAIA questions`);
      }
      
      if (everWrongCount > 0) {
        reasons.push(`Has ${everWrongCount} Ever Wrong questions`);
      } else if (isaacProgress.length > 0) {
        reasons.push('NO Ever Wrong questions (explains filter failure)');
        likelihood = likelihood === 'HIGH' ? 'HIGH' : 'Medium';
      }
      
      console.log(`  🎯 Likelihood: ${likelihood}`);
      if (reasons.length > 0) {
        console.log(`  💡 Reasons: ${reasons.join(', ')}`);
      }
      
      if (likelihood !== 'Low') {
        candidates.push({
          userId,
          likelihood,
          totalProgress,
          isaacProgress: isaacProgress.length,
          everWrongCount,
          states,
          reasons
        });
      }
    }
    
    console.log(`\n🎯 CANDIDATES FOR aemjk4h@protonmail.com:`);
    console.log('==========================================');
    
    candidates.sort((a, b) => {
      if (a.likelihood === 'HIGH' && b.likelihood !== 'HIGH') return -1;
      if (b.likelihood === 'HIGH' && a.likelihood !== 'HIGH') return 1;
      return b.isaacProgress - a.isaacProgress;
    });
    
    candidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. User: ${candidate.userId}`);
      console.log(`   Likelihood: ${candidate.likelihood}`);
      console.log(`   ISACA Progress: ${candidate.isaacProgress}/178`);
      console.log(`   Ever Wrong: ${candidate.everWrongCount}`);
      console.log(`   Reasons: ${candidate.reasons.join(', ')}`);
      
      if (candidate.likelihood === 'HIGH' && candidate.everWrongCount === 0) {
        console.log(`   ⚠️  THIS USER EXPLAINS THE EVER WRONG FILTER FAILURE!`);
        console.log(`   💡 All questions answered correctly on first try`);
      }
    });
    
    if (candidates.length === 0) {
      console.log(`❌ No likely candidates found!`);
      console.log(`   This suggests the user might be authenticating as a completely new user ID`);
      console.log(`   or there's a fundamental authentication issue.`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findAllAemjk4hUsers().catch(console.error);