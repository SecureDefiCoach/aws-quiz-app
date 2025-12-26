#!/usr/bin/env node

/**
 * Test Domain 1 + Ever Wrong filter for iPad user
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testDomain1EverWrong() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db('aws-quiz-db');
    
    console.log('🔍 Testing Domain 1 + Ever Wrong Filter');
    console.log('======================================');
    
    const userId = '84984478-40b1-703d-53d0-aef7aad3a874'; // The iPad user
    const examNumber = 'ISACA-AAIA';
    const subDomain = '1'; // Domain 1
    const states = ['EVER_WRONG'];
    
    console.log(`👤 iPad User: ${userId}`);
    console.log(`📚 Exam: ${examNumber}`);
    console.log(`🏷️  Subdomain: ${subDomain}`);
    console.log(`🎯 States: [${states.join(', ')}]`);
    
    const questions = db.collection('questions');
    const userProgress = db.collection('userProgress');
    
    // First, let's see what Domain 1 questions exist
    console.log(`\n📊 Analyzing Domain 1 questions:`);
    const domain1Questions = await questions.find({ 
      examNumber, 
      subDomainNum: subDomain 
    }).toArray();
    
    console.log(`📚 Total Domain 1 questions: ${domain1Questions.length}`);
    
    if (domain1Questions.length === 0) {
      console.log(`❌ NO DOMAIN 1 QUESTIONS FOUND!`);
      console.log(`   This could be the issue - let's check what subdomains exist:`);
      
      const subdomains = await questions.aggregate([
        { $match: { examNumber } },
        { $group: { _id: '$subDomainNum', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();
      
      console.log(`📊 Available subdomains:`);
      subdomains.forEach(sd => {
        console.log(`   ${sd._id}: ${sd.count} questions`);
      });
      
      return;
    }
    
    // Get user progress for Domain 1 questions
    const domain1QuestionIds = domain1Questions.map(q => q._id);
    const domain1Progress = await userProgress.find({
      userId,
      questionId: { $in: domain1QuestionIds }
    }).toArray();
    
    console.log(`📈 User progress for Domain 1: ${domain1Progress.length}`);
    
    // Check Ever Wrong questions in Domain 1
    const domain1EverWrong = domain1Progress.filter(p => p.wrongCount > 0);
    console.log(`❌ Domain 1 Ever Wrong questions: ${domain1EverWrong.length}`);
    
    if (domain1EverWrong.length === 0) {
      console.log(`⚠️  NO EVER WRONG QUESTIONS IN DOMAIN 1!`);
      console.log(`   This explains why the filter fails.`);
      
      console.log(`\n📊 Domain 1 progress breakdown:`);
      const states = {};
      domain1Progress.forEach(p => {
        states[p.state] = (states[p.state] || 0) + 1;
      });
      
      Object.entries(states).forEach(([state, count]) => {
        console.log(`   ${state}: ${count}`);
      });
      
      console.log(`\n💡 SOLUTIONS:`);
      console.log(`   1. Select "All Subdomains" instead of Domain 1`);
      console.log(`   2. Select additional states like "NEW" or "RIGHT"`);
      console.log(`   3. Choose a different domain that has Ever Wrong questions`);
      
    } else {
      console.log(`✅ Domain 1 has Ever Wrong questions - filter should work`);
      
      console.log(`📝 Sample Domain 1 Ever Wrong questions:`);
      domain1EverWrong.slice(0, 5).forEach((p, index) => {
        console.log(`   ${index + 1}. State: ${p.state}, Right: ${p.rightCount}, Wrong: ${p.wrongCount}`);
      });
    }
    
    // Now simulate the exact startQuiz logic for Domain 1
    console.log(`\n🔄 Simulating startQuiz logic for Domain 1:`);
    
    // Build match criteria
    const matchCriteria = { examNumber, subDomainNum: subDomain };
    
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
    
    // Fetch all matching questions (Domain 1, non-mastered)
    const allQuestions = await questions.find(matchCriteria).toArray();
    console.log(`📚 Domain 1 questions after mastered exclusion: ${allQuestions.length}`);
    
    // Filter by EVER_WRONG state
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
    
    console.log(`✅ Final filtered questions: ${filteredQuestions.length}`);
    
    if (filteredQuestions.length === 0) {
      console.log(`❌ QUIZ WOULD FAIL: "No questions match the selected filters"`);
    } else {
      console.log(`✅ QUIZ WOULD SUCCEED: ${filteredQuestions.length} questions available`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testDomain1EverWrong().catch(console.error);